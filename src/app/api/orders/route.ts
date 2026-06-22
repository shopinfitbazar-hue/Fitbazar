import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOrdersFromCheckoutPayload, mapCheckoutErrorToResponse, prepareCheckoutContext, type CheckoutPayload } from "@/lib/checkout-server";
import { IdempotencyError, readIdempotencyKey, runIdempotent } from "@/lib/idempotency";
import { buildPaginationMeta, getPagination } from "@/lib/pagination";
import { isSupportedPaymentMethod } from "@/lib/payment-types";
import { isDeliveryMethod } from "@/lib/shipping";
import { requireCustomerSession } from "@/lib/server-auth";
import { getPublicVendorName, getPublicVendorSlug } from "@/lib/public-vendor-identity";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

function authStatus(error: string) {
  return error === "Unauthorized" ? 401 : 403;
}

export async function GET(request: Request) {
  try {
    const auth = await requireCustomerSession();

    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: authStatus(auth.error) });
    }

    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip, take } = getPagination(searchParams, {
      defaultPageSize: 25,
      maxPageSize: 100,
    });
    const where = { customerId: auth.session.user.id };

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
              address: true,
              zone: true,
              district: true,
              phone: true,
              panNumber: true,
              isPartnered: true,
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
      orders: orders.map((order) => {
        const canShowVendor = Boolean(order.vendor.isPartnered);

        return {
          ...order,
          vendor: canShowVendor
            ? order.vendor
            : {
                ...order.vendor,
                shopName: getPublicVendorName(order.vendor),
                slug: getPublicVendorSlug(order.vendor) ?? null,
                logo: null,
                address: null,
                zone: null,
                district: null,
                phone: null,
                panNumber: null,
              },
        };
      }),
      pagination: buildPaginationMeta(total, page, pageSize),
    });
  } catch (error) {
    logger.error("Error fetching orders", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireCustomerSession();

    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: authStatus(auth.error) });
    }

    const body = (await req.json()) as Partial<CheckoutPayload> & { idempotencyKey?: string };
    const paymentMethod = typeof body.paymentMethod === "string" ? body.paymentMethod.toUpperCase() : "";
    const idempotencyKey = readIdempotencyKey(req, body);
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
        { error: "Online payments must be initiated through /api/payments/initiate." },
        { status: 400 },
      );
    }

    if (!isDeliveryMethod(body.deliveryMethod || "")) {
      return NextResponse.json({ error: "Unsupported delivery method." }, { status: 400 });
    }

    const result = await runIdempotent({
      userId: auth.session.user.id,
      scope: "orders:create:cod",
      key: idempotencyKey,
      requestPayload,
      handler: async () => {
        const context = await prepareCheckoutContext(auth.session.user.id, {
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
    logger.error("Error creating order", error);
    if (error instanceof IdempotencyError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const mapped = mapCheckoutErrorToResponse(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
