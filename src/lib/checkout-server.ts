import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { allocateAmountAcrossSubtotals, calculateOrderAmounts, groupItemsByVendor, roundCurrency, type CanonicalOrderItem } from "@/lib/order-routing";
import { isSupportedPaymentMethod, type SupportedPaymentMethod } from "@/lib/payment-types";
import { getShippingAmount, isDeliveryMethod, type DeliveryMethod } from "@/lib/shipping";
import { publicProductVendorFilter } from "@/lib/public-storefront";
import { ProductStatus } from "@prisma/client";
import { buildAbsoluteAppUrl } from "@/lib/app-url";
import { renderOrderPlacedEmail, renderVendorOrderEmail } from "@/lib/email-templates";
import { hasConfiguredMailTransport, sendMail } from "@/lib/mailer";

export type CheckoutItemInput = {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
};

export type CheckoutAddressInput = {
  name: string;
  phone: string;
  line1: string;
  zone: string;
  district: string;
  email?: string;
};

export type CheckoutPayload = {
  items: CheckoutItemInput[];
  address: CheckoutAddressInput;
  paymentMethod: SupportedPaymentMethod;
  couponCode?: string;
  deliveryMethod: DeliveryMethod;
};

type CouponRecord = {
  id: string;
  code: string;
  discountPct: number;
  usedCount: number;
  maxUses: number;
};

type ProductRecord = {
  id: string;
  vendorId: string;
  price: number;
  stock: number;
  vendor: {
    userId: string;
    user: {
      email: string;
    };
    shopName: string;
    commissionPct: number;
  };
};

export type PreparedCheckoutContext = {
  customerId: string;
  items: Array<CanonicalOrderItem & { vendorUserId: string }>;
  address: CheckoutAddressInput;
  paymentMethod: SupportedPaymentMethod;
  deliveryMethod: DeliveryMethod;
  coupon: CouponRecord | null;
  subtotal: number;
  couponDiscountTotal: number;
  shippingAmount: number;
  grandTotal: number;
  products: ProductRecord[];
  productMap: Map<string, ProductRecord>;
};

export function buildOrderNumber() {
  return `FB-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function buildCheckoutError(code: string, message: string) {
  const error = new Error(message);
  error.name = code;
  return error;
}

function normalizeCoupon(record: {
  id: string;
  code: string;
  discountPct: number;
  usedCount: number;
  maxUses: number;
  isActive: boolean;
  expiresAt: Date | null;
} | null): CouponRecord | null {
  if (
    !record ||
    !record.isActive ||
    record.usedCount >= record.maxUses ||
    (record.expiresAt && record.expiresAt <= new Date())
  ) {
    return null;
  }

  return {
    id: record.id,
    code: record.code,
    discountPct: record.discountPct,
    usedCount: record.usedCount,
    maxUses: record.maxUses,
  };
}

export async function prepareCheckoutContext(customerId: string, payload: CheckoutPayload): Promise<PreparedCheckoutContext> {
  if (!payload.items?.length) {
    throw buildCheckoutError("MISSING_ITEMS", "Your cart is empty.");
  }

  if (!payload.address?.name || !payload.address?.phone || !payload.address?.line1 || !payload.address?.zone || !payload.address?.district) {
    throw buildCheckoutError("MISSING_ADDRESS", "Delivery address is incomplete.");
  }

  if (!isSupportedPaymentMethod(payload.paymentMethod)) {
    throw buildCheckoutError("INVALID_PAYMENT_METHOD", "Unsupported payment method.");
  }

  if (!isDeliveryMethod(payload.deliveryMethod)) {
    throw buildCheckoutError("INVALID_DELIVERY_METHOD", "Unsupported delivery method.");
  }

  const productIds = Array.from(new Set(payload.items.map((item) => item.productId)));
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      status: ProductStatus.ACTIVE,
      vendor: publicProductVendorFilter,
    },
    include: {
      vendor: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (products.length !== productIds.length) {
    throw buildCheckoutError("PRODUCT_NOT_FOUND", "One or more products are no longer available.");
  }

  const productMap = new Map(products.map((product) => [product.id, product]));

  const normalizedItems = payload.items.map((item) => {
    const product = productMap.get(item.productId);

    if (!product) {
      throw buildCheckoutError("PRODUCT_NOT_FOUND", "One or more products could not be found.");
    }

    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      throw buildCheckoutError("INVALID_QUANTITY", "Invalid item quantity.");
    }

    if (product.stock < item.quantity) {
      throw buildCheckoutError("INSUFFICIENT_STOCK", "Insufficient stock for one or more items.");
    }

    return {
      productId: product.id,
      vendorId: product.vendorId,
      vendorUserId: product.vendor.userId,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      price: product.price,
    };
  });

  const subtotal = roundCurrency(
    normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
  );

  const siteSettings = await prisma.siteSettings.findFirst({
    select: {
      minFreeDelivery: true,
    },
  });

  const shippingAmount = roundCurrency(
    getShippingAmount({
      subtotal,
      deliveryMethod: payload.deliveryMethod,
      freeDeliveryThreshold: siteSettings?.minFreeDelivery,
    }),
  );

  const coupon = payload.couponCode
    ? normalizeCoupon(
        await prisma.coupon.findUnique({
          where: { code: payload.couponCode.trim().toUpperCase() },
          select: {
            id: true,
            code: true,
            discountPct: true,
            usedCount: true,
            maxUses: true,
            isActive: true,
            expiresAt: true,
          },
        }),
      )
    : null;

  const couponDiscountTotal = roundCurrency(coupon ? subtotal * (coupon.discountPct / 100) : 0);
  const grandTotal = roundCurrency(subtotal - couponDiscountTotal + shippingAmount);

  return {
    customerId,
    items: normalizedItems,
    address: payload.address,
    paymentMethod: payload.paymentMethod,
    deliveryMethod: payload.deliveryMethod,
    coupon,
    subtotal,
    couponDiscountTotal,
    shippingAmount,
    grandTotal,
    products,
    productMap,
  };
}

export async function createOrdersFromCheckoutPayload(input: {
  context: PreparedCheckoutContext;
  paymentReference?: string;
  checkoutGroupId?: string;
}) {
  const { context, paymentReference, checkoutGroupId } = input;
  const itemsByVendor = groupItemsByVendor(context.items);
  const vendorIds = Object.keys(itemsByVendor);
  const vendorSubtotals = vendorIds.map((vendorId) =>
    roundCurrency(itemsByVendor[vendorId].reduce((sum, item) => sum + item.price * item.quantity, 0)),
  );
  const couponAllocations = allocateAmountAcrossSubtotals(context.couponDiscountTotal, vendorSubtotals);
  const shippingAllocations = allocateAmountAcrossSubtotals(context.shippingAmount, vendorSubtotals);
  let didCreateOrders = false;

  const orders = await prisma.$transaction(async (tx) => {
    if (checkoutGroupId) {
      const existingOrders = await tx.order.findMany({
        where: { checkoutGroupId },
        include: {
          items: true,
        },
        orderBy: { createdAt: "asc" },
      });

      if (existingOrders.length) {
        return existingOrders;
      }
    }

    if (context.coupon) {
      const latestCoupon = await tx.coupon.findUnique({
        where: { id: context.coupon.id },
        select: {
          id: true,
          code: true,
          discountPct: true,
          usedCount: true,
          maxUses: true,
          isActive: true,
          expiresAt: true,
        },
      });

      if (!normalizeCoupon(latestCoupon)) {
        throw buildCheckoutError("COUPON_INVALID", "Coupon is no longer valid.");
      }
    }

    for (const item of context.items) {
      const currentProduct = await tx.product.findUnique({
        where: { id: item.productId },
        select: { stock: true },
      });

      if (!currentProduct || currentProduct.stock < item.quantity) {
        throw buildCheckoutError("INSUFFICIENT_STOCK", "Insufficient stock for one or more items.");
      }
    }

    const createdOrders = [];

    for (let index = 0; index < vendorIds.length; index += 1) {
      const vendorId = vendorIds[index];
      const vendorItems = itemsByVendor[vendorId];
      const vendor = context.products.find((product) => product.vendorId === vendorId)?.vendor;

      if (!vendor) {
        throw buildCheckoutError("VENDOR_NOT_FOUND", "Vendor not found for one or more items.");
      }

      const couponShare = couponAllocations[index] ?? 0;
      const shippingShare = shippingAllocations[index] ?? 0;
      const { totalAmount, commissionAmt, vendorPayout } = calculateOrderAmounts({
        items: vendorItems,
        commissionPct: vendor.commissionPct,
        couponDiscountAmount: couponShare,
        shippingAmount: shippingShare,
      });
      const orderNumber = buildOrderNumber();

      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          checkoutGroupId,
          customerId: context.customerId,
          vendorId,
          totalAmount,
          commissionAmt,
          vendorPayout,
          status: "PENDING",
          paymentMethod: context.paymentMethod,
          paymentStatus: context.paymentMethod === "COD" ? "PENDING" : "PAID",
          paymentReference: paymentReference ?? undefined,
          deliveryAddress: {
            ...context.address,
            deliveryMethod: context.deliveryMethod,
            shippingAmount: shippingShare,
            couponDiscount: couponShare,
            paymentReference: paymentReference ?? undefined,
          },
          items: {
            create: vendorItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              size: item.size,
              color: item.color,
              price: item.price,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      createdOrders.push(createdOrder);

      for (const item of vendorItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            totalSold: { increment: item.quantity },
          },
        });
      }

      await tx.notification.createMany({
        data: [
          {
            userId: context.customerId,
            title: "Order placed successfully",
            message: `Your order ${orderNumber} has been placed with ${vendor.shopName}.`,
            type: "ORDER",
            link: "/account/orders",
          },
          {
            userId: vendor.userId,
            title: "New order received",
            message: `Order ${orderNumber} is waiting for confirmation.`,
            type: "ORDER",
            link: "/vendor/orders",
          },
        ],
      });
    }

    if (context.coupon) {
      await tx.coupon.update({
        where: { id: context.coupon.id },
        data: {
          usedCount: { increment: 1 },
        },
      });
    }

    didCreateOrders = true;
    return createdOrders;
  });

  if (didCreateOrders && hasConfiguredMailTransport()) {
    await sendOrderEmails(context, orders).catch((error) => {
      console.error("[orders] Failed to send order email:", error);
    });
  }

  return orders;
}

async function sendOrderEmails(context: PreparedCheckoutContext, orders: Array<{ orderNumber: string; vendorId: string }>) {
  const orderNumbers = orders.map((order) => order.orderNumber).join(", ");

  if (context.address.email) {
    await sendMail({
      to: context.address.email,
      subject: `Fit Bazar order confirmed: ${orderNumbers}`,
      text: `Your Fit Bazar order has been placed: ${orderNumbers}`,
      html: renderOrderPlacedEmail(context.address.name || "there", orderNumbers, buildAbsoluteAppUrl("/account/orders")),
    });
  }

  await Promise.all(
    orders.map(async (order) => {
      const product = context.products.find((item) => item.vendorId === order.vendorId);
      const vendorEmail = product?.vendor.user.email;
      if (!product || !vendorEmail) return;

      await sendMail({
        to: vendorEmail,
        from: process.env.VENDOR_SUPPORT_EMAIL_FROM || "vendorSupport@fitbazar.com",
        subject: `New Fit Bazar order: ${order.orderNumber}`,
        text: `Order ${order.orderNumber} is waiting in your vendor dashboard.`,
        html: renderVendorOrderEmail(product.vendor.shopName, order.orderNumber, buildAbsoluteAppUrl("/vendor/orders")),
      });
    }),
  );
}

export function buildPaymentReference(prefix: string) {
  return `${prefix}-${crypto.randomBytes(8).toString("hex")}`;
}

export function mapCheckoutErrorToResponse(error: unknown) {
  if (!(error instanceof Error)) {
    return { status: 500, message: "Payment processing failed." };
  }

  switch (error.name) {
    case "MISSING_ITEMS":
    case "MISSING_ADDRESS":
    case "INVALID_PAYMENT_METHOD":
    case "INVALID_DELIVERY_METHOD":
    case "PRODUCT_NOT_FOUND":
    case "INVALID_QUANTITY":
    case "INSUFFICIENT_STOCK":
    case "COUPON_INVALID":
    case "VENDOR_NOT_FOUND":
      return { status: 400, message: error.message };
    default:
      if (error.message.includes("not configured yet") || error.message.includes("not wired yet")) {
        return { status: 503, message: error.message };
      }
      return { status: 500, message: "Payment processing failed." };
  }
}
