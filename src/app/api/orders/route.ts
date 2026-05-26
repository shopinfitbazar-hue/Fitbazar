import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOrdersFromCheckoutPayload, mapCheckoutErrorToResponse, prepareCheckoutContext, type CheckoutPayload } from "@/lib/checkout-server";
import { isSupportedPaymentMethod } from "@/lib/payment-types";
import { isDeliveryMethod } from "@/lib/shipping";
import { requireCustomerSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function authStatus(error: string) {
  return error === "Unauthorized" ? 401 : 403;
}

export async function GET() {
  try {
    const auth = await requireCustomerSession();

    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: authStatus(auth.error) });
    }

    const orders = await prisma.order.findMany({
      where: { customerId: auth.session.user.id },
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
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireCustomerSession();

    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: authStatus(auth.error) });
    }

    const body = (await req.json()) as Partial<CheckoutPayload>;
    const paymentMethod = typeof body.paymentMethod === "string" ? body.paymentMethod.toUpperCase() : "";

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

    const context = await prepareCheckoutContext(auth.session.user.id, {
      items: body.items,
      address: body.address,
      paymentMethod,
      couponCode: body.couponCode,
      deliveryMethod: body.deliveryMethod as "standard" | "express" | "pickup",
    });
    const orders = await createOrdersFromCheckoutPayload({ context });

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    const mapped = mapCheckoutErrorToResponse(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
