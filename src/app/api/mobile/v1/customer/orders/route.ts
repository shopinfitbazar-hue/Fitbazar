import { NextResponse } from "next/server";
import { createOrdersFromCheckoutPayload, mapCheckoutErrorToResponse, prepareCheckoutContext, type CheckoutPayload } from "@/lib/checkout-server";
import { IdempotencyError, readIdempotencyKey, runIdempotent } from "@/lib/idempotency";
import { requireMobileCustomer } from "@/lib/mobile-api-auth";
import { MobileAuthError } from "@/lib/mobile-auth";
import { buildPaginationMeta, getPagination } from "@/lib/pagination";
import { isSupportedPaymentMethod } from "@/lib/payment-types";
import { prisma } from "@/lib/prisma";
import { getPublicVendorName, getPublicVendorSlug } from "@/lib/public-vendor-identity";
import { isDeliveryMethod } from "@/lib/shipping";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireMobileCustomer(request);
    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip, take } = getPagination(searchParams, {
      defaultPageSize: 25,
      maxPageSize: 100,
    });
    const where = { customerId: auth.user.id };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                  images: true,
                },
              },
            },
          },
          vendor: {
            select: {
              shopName: true,
              slug: true,
              logo: true,
              isPartnered: true,
            },
          },
          deliveryAssignment: {
            select: {
              status: true,
              pickupAt: true,
              inTransitAt: true,
              deliveredAt: true,
              failedAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders: orders.map((order) => ({
        ...order,
        vendor: order.vendor.isPartnered
          ? order.vendor
          : {
              ...order.vendor,
              shopName: getPublicVendorName(order.vendor),
              slug: getPublicVendorSlug(order.vendor) ?? null,
              logo: null,
            },
      })),
      pagination: buildPaginationMeta(total, page, pageSize),
    });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    logger.error("Error fetching mobile orders", error);
    return NextResponse.json({ error: "Failed to fetch orders." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireMobileCustomer(request);
    const body = (await request.json()) as Partial<CheckoutPayload> & { idempotencyKey?: string };
    const paymentMethod = typeof body.paymentMethod === "string" ? body.paymentMethod.toUpperCase() : "";
    const idempotencyKey = readIdempotencyKey(request, body);
    const requestPayload = { ...body };
    delete requestPayload.idempotencyKey;

    if (!body.items?.length || !body.address || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!isSupportedPaymentMethod(paymentMethod)) {
      return NextResponse.json({ error: "Unsupported payment method." }, { status: 400 });
    }

    if (paymentMethod !== "COD") {
      return NextResponse.json(
        { error: "Online payments must be initiated through the mobile payment initiation endpoint." },
        { status: 400 },
      );
    }

    if (!isDeliveryMethod(body.deliveryMethod || "")) {
      return NextResponse.json({ error: "Unsupported delivery method." }, { status: 400 });
    }

    const result = await runIdempotent({
      userId: auth.user.id,
      scope: "mobile:orders:create:cod",
      key: idempotencyKey,
      requestPayload,
      handler: async () => {
        const context = await prepareCheckoutContext(auth.user.id, {
          items: body.items || [],
          address: body.address as CheckoutPayload["address"],
          paymentMethod,
          couponCode: body.couponCode,
          deliveryMethod: body.deliveryMethod as "standard" | "express" | "pickup",
        });
        const orders = await createOrdersFromCheckoutPayload({ context });

        return {
          payload: {
            success: true,
            orders,
          },
        };
      },
    });

    return NextResponse.json(result.payload, {
      status: result.status,
      headers: result.replayed ? { "Idempotency-Replayed": "true" } : undefined,
    });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof IdempotencyError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    logger.error("Error creating mobile order", error);
    const mapped = mapCheckoutErrorToResponse(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
