import { NextResponse } from "next/server";
import { createOrdersFromCheckoutPayload, mapCheckoutErrorToResponse, prepareCheckoutContext, type CheckoutPayload } from "@/lib/checkout-server";
import { isSupportedPaymentMethod } from "@/lib/payment-types";
import { buildCheckoutId, clearExpiredPaymentAttempts, createPaymentAttempt, initiateConnectIpsPayment, initiateEsewaPayment, initiateFonepayPayment, initiateKhaltiPayment } from "@/lib/payment-server";
import { isDeliveryMethod } from "@/lib/shipping";
import { requireCustomerSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function authStatus(error: string) {
  return error === "Unauthorized" ? 401 : 403;
}

export async function POST(req: Request) {
  try {
    const auth = await requireCustomerSession();

    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: authStatus(auth.error) });
    }

    const body = (await req.json()) as Partial<CheckoutPayload>;
    const paymentMethod = typeof body.paymentMethod === "string" ? body.paymentMethod.toUpperCase() : "";

    if (!isSupportedPaymentMethod(paymentMethod)) {
      return NextResponse.json({ error: "Unsupported payment method." }, { status: 400 });
    }

    if (!isDeliveryMethod(body.deliveryMethod || "")) {
      return NextResponse.json({ error: "Unsupported delivery method." }, { status: 400 });
    }

    await clearExpiredPaymentAttempts().catch(() => undefined);

    const context = await prepareCheckoutContext(auth.session.user.id, {
      items: body.items || [],
      address: body.address as CheckoutPayload["address"],
      paymentMethod,
      couponCode: body.couponCode,
      deliveryMethod: body.deliveryMethod as "standard" | "express" | "pickup",
    });

    if (paymentMethod === "COD") {
      const orders = await createOrdersFromCheckoutPayload({ context });
      return NextResponse.json({
        success: true,
        paymentMethod,
        mode: "completed",
        orders,
        redirectUrl: `/order-confirmation?order=${encodeURIComponent(orders[0]?.orderNumber || "FB-ORDER")}`,
      });
    }

    const checkoutId = buildCheckoutId();
    const attempt = await createPaymentAttempt({
      checkoutId,
      customerId: auth.session.user.id,
      amount: context.grandTotal,
      paymentMethod,
      payload: {
        checkoutId,
        customerId: auth.session.user.id,
        items: context.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        })),
        address: context.address,
        paymentMethod,
        couponCode: context.coupon?.code,
        deliveryMethod: context.deliveryMethod,
        createdAt: new Date().toISOString(),
      },
    });

    try {
      if (paymentMethod === "KHALTI" || paymentMethod === "LOCAL_CARD") {
        const result = await initiateKhaltiPayment({
          paymentMethod,
          checkoutId,
          paymentToken: attempt.token,
          context,
        });

        return NextResponse.json({
          success: true,
          paymentMethod,
          mode: "redirect",
          redirectUrl: result.redirectUrl,
          reference: result.reference,
        });
      }

      if (paymentMethod === "ESEWA") {
        const result = await initiateEsewaPayment({
          checkoutId,
          paymentToken: attempt.token,
          context,
        });

        return NextResponse.json({
          success: true,
          paymentMethod,
          mode: "form_post",
          formAction: result.formAction,
          formFields: result.fields,
          reference: result.reference,
        });
      }

      const result =
        paymentMethod === "CONNECTIPS"
          ? await initiateConnectIpsPayment({
              checkoutId,
              paymentToken: attempt.token,
              context,
            })
          : await initiateFonepayPayment({
              checkoutId,
              paymentToken: attempt.token,
              context,
            });

      return NextResponse.json({
        success: true,
        paymentMethod,
        mode: "redirect",
        redirectUrl: result.redirectUrl,
        reference: result.reference,
      });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error initiating payment:", error);
    const mapped = mapCheckoutErrorToResponse(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
