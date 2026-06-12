import { NextResponse } from "next/server";
import { buildAbsoluteAppUrl } from "@/lib/app-url";
import { formatPriceNpr } from "@/lib/catalog";
import { renderOrderBillEmail } from "@/lib/email-templates";
import { hasConfiguredMailTransport, sendMail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { roundCurrency } from "@/lib/order-routing";
import { requireCustomerSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function authStatus(error: string) {
  return error === "Unauthorized" ? 401 : 403;
}

function jsonObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function jsonString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function jsonNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function addressLine(parts: string[]) {
  return parts.filter(Boolean).join(", ");
}

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireCustomerSession();

    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: authStatus(auth.error) });
    }

    if (!hasConfiguredMailTransport()) {
      return NextResponse.json({ error: "Email service is not configured." }, { status: 503 });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: params.id,
        customerId: auth.session.user.id,
      },
      include: {
        customer: {
          select: {
            email: true,
            name: true,
          },
        },
        vendor: {
          select: {
            shopName: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const deliveryAddress = jsonObject(order.deliveryAddress);
    const customerEmail = jsonString(deliveryAddress.email) || order.customer.email;

    if (!customerEmail) {
      return NextResponse.json({ error: "No customer email is available for this order." }, { status: 400 });
    }

    const subtotal = roundCurrency(order.items.reduce((sum, item) => sum + item.price * item.quantity, 0));
    const shipping = jsonNumber(deliveryAddress.shippingAmount);
    const discount = jsonNumber(deliveryAddress.couponDiscount);
    const tax = 0;
    const billUrl = buildAbsoluteAppUrl(`/account/orders?bill=${encodeURIComponent(order.orderNumber)}`);
    const deliveryAddressText = addressLine([
      jsonString(deliveryAddress.line1),
      jsonString(deliveryAddress.district),
      jsonString(deliveryAddress.zone),
      jsonString(deliveryAddress.pincode),
    ]);
    const customerName = jsonString(deliveryAddress.name) || order.customer.name || "Customer";

    const mailResult = await sendMail({
      to: customerEmail,
      subject: `Fit Bazar official bill and thank you: ${order.orderNumber}`,
      text: `Thank you for shopping with Fit Bazar. Your official bill for order number ${order.orderNumber} is ready. Total: ${formatPriceNpr(order.totalAmount)}. तपाईंको किनमेलको लागि धन्यवाद। शुभ दिनको कामना। Open or print it here: ${billUrl}`,
      html: renderOrderBillEmail({
        customerName,
        customerEmail,
        deliveryAddress: deliveryAddressText,
        billUrl,
        subtotal,
        shipping,
        discount,
        tax,
        total: order.totalAmount,
        orders: [
          {
            orderNumber: order.orderNumber,
            vendorName: order.vendor.shopName,
            createdAt: order.createdAt,
            paymentMethod: order.paymentMethod,
            subtotal,
            shipping,
            discount,
            tax,
            total: order.totalAmount,
            items: order.items.map((item) => ({
              name: item.product?.name || "Product",
              quantity: item.quantity,
              size: item.size,
              color: item.color,
              price: item.price,
              total: roundCurrency(item.price * item.quantity),
            })),
          },
        ],
      }),
    });

    if (!mailResult.delivered) {
      console.error("[orders] Bill resend was not delivered:", {
        orderNumber: order.orderNumber,
        reason: mailResult.reason,
      });
      return NextResponse.json({ error: "Email provider did not deliver the bill." }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: "Bill email sent." });
  } catch (error) {
    console.error("Error emailing order bill:", error);
    return NextResponse.json({ error: "Failed to email bill." }, { status: 500 });
  }
}
