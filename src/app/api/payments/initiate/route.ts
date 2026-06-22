import { NextResponse } from "next/server";
import { createOrdersFromCheckoutPayload, mapCheckoutErrorToResponse, prepareCheckoutContext, type CheckoutPayload } from "@/lib/checkout-server";
import { IdempotencyError, readIdempotencyKey, runIdempotent } from "@/lib/idempotency";
import { isSupportedPaymentMethod } from "@/lib/payment-types";
import { buildCheckoutId, clearExpiredPaymentAttempts, createPaymentAttempt, initiateConnectIpsPayment, initiateEsewaPayment, initiateFonepayPayment, initiateKhaltiPayment } from "@/lib/payment-server";
import { isDeliveryMethod } from "@/lib/shipping";
import { requireCustomerSession } from "@/lib/server-auth";
import { logger } from "@/lib/logger";

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

    const body = (await req.json()) as Partial<CheckoutPayload> & { idempotencyKey?: string };
    const paymentMethod = typeof body.paymentMethod === "string" ? body.paymentMethod.toUpperCase() : "";
    const idempotencyKey = readIdempotencyKey(req, body);
    const requestPayload = { ...body };
    delete requestPayload.idempotencyKey;

    if (!isSupportedPaymentMethod(paymentMethod)) {
      return NextResponse.json({ error: "Unsupported payment method." }, { status: 400 });
    }

    if (!isDeliveryMethod(body.deliveryMethod || "")) {
      return NextResponse.json({ error: "Unsupported delivery method." }, { status: 400 });
    }

    const result = await runIdempotent<Record<string, unknown>>({
      userId: auth.session.user.id,
      scope: `payments:initiate:${paymentMethod}`,
      key: idempotencyKey,
      requestPayload,
      handler: async () => {
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
          return {
            payload: {
              success: true,
              paymentMethod,
              mode: "completed",
              orders,
              redirectUrl: `/order-confirmation?order=${encodeURIComponent(orders[0]?.orderNumber || "FB-ORDER")}`,
            } satisfies Record<string, unknown>,
          };
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

        if (paymentMethod === "KHALTI" || paymentMethod === "LOCAL_CARD") {
          const payment = await initiateKhaltiPayment({
            paymentMethod,
            checkoutId,
            paymentToken: attempt.token,
            context,
          });

          return {
            payload: {
              success: true,
              paymentMethod,
              mode: "redirect",
              redirectUrl: payment.redirectUrl,
              reference: payment.reference,
            } satisfies Record<string, unknown>,
          };
        }

        if (paymentMethod === "ESEWA") {
          const payment = await initiateEsewaPayment({
            checkoutId,
            paymentToken: attempt.token,
            context,
          });

          return {
            payload: {
              success: true,
              paymentMethod,
              mode: "form_post",
              formAction: payment.formAction,
              formFields: payment.fields,
              reference: payment.reference,
            } satisfies Record<string, unknown>,
          };
        }

        const payment =
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

        return {
          payload: {
            success: true,
            paymentMethod,
            mode: "redirect",
            redirectUrl: payment.redirectUrl,
            reference: payment.reference,
          } satisfies Record<string, unknown>,
        };
      },
    });

    return NextResponse.json(result.payload, {
      status: result.status,
      headers: result.replayed ? { "Idempotency-Replayed": "true" } : undefined,
    });
  } catch (error) {
    logger.error("Error initiating payment", error);
    if (error instanceof IdempotencyError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const mapped = mapCheckoutErrorToResponse(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
