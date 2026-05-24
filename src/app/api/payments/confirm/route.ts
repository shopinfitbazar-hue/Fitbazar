import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createOrdersFromCheckoutPayload, mapCheckoutErrorToResponse, prepareCheckoutContext } from "@/lib/checkout-server";
import { cancelPaymentAttemptByToken, claimPaymentAttempt, failPaymentAttemptByToken, finalizePaymentAttempt, loadPaymentAttemptByToken, verifyConnectIpsPayment, verifyEsewaPayment, verifyFonepayPayment, verifyKhaltiPayment } from "@/lib/payment-server";
import { isSupportedPaymentMethod } from "@/lib/payment-types";

export const dynamic = "force-dynamic";

type ConfirmBody = {
  method?: string;
  token?: string;
  pidx?: string;
  encodedData?: string;
  status?: string;
  transactionId?: string;
};

export async function POST(req: Request) {
  let body: ConfirmBody | null = null;
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    body = (await req.json()) as ConfirmBody;
    const method = typeof body.method === "string" ? body.method.toUpperCase() : "";

    if (!isSupportedPaymentMethod(method) || method === "COD") {
      return NextResponse.json({ error: "Unsupported payment confirmation method." }, { status: 400 });
    }

    if (!body.token) {
      return NextResponse.json({ error: "Missing payment token." }, { status: 400 });
    }

    const paymentAttempt = await loadPaymentAttemptByToken(body.token);

    if (!paymentAttempt) {
      return NextResponse.json({ error: "Payment session is invalid or has expired." }, { status: 410 });
    }

    if (session?.user?.id && session.user.id !== paymentAttempt.payload.customerId) {
      return NextResponse.json({ error: "Payment session does not belong to this user." }, { status: 403 });
    }

    if (body.status && ["failed", "user canceled", "cancelled"].includes(body.status.toLowerCase())) {
      await cancelPaymentAttemptByToken(body.token).catch(() => undefined);
      return NextResponse.json({ error: "Payment was cancelled before completion." }, { status: 400 });
    }

    const claim = await claimPaymentAttempt({
      token: body.token,
      expectedMethod: method,
    });

    if (claim.state === "expired") {
      return NextResponse.json({ error: "Payment session is invalid or has expired." }, { status: 410 });
    }

    if (claim.state === "invalid") {
      return NextResponse.json({ error: "Payment session does not match this payment method." }, { status: 400 });
    }

    if (claim.state === "failed") {
      return NextResponse.json({ error: "This payment attempt is no longer payable." }, { status: 400 });
    }

    if (claim.state === "processing") {
      return NextResponse.json({ error: "This payment is already being processed. Please wait a moment and refresh." }, { status: 409 });
    }

    if (claim.state === "succeeded") {
      const existingOrders =
        claim.orders ||
        (await createOrdersFromCheckoutPayload({
          context: await prepareCheckoutContext(claim.attempt.customerId, claim.attempt.payload),
          paymentReference: claim.attempt.providerReference || undefined,
          checkoutGroupId: claim.attempt.checkoutId,
        }));

      return NextResponse.json({
        success: true,
        orders: existingOrders,
        redirectUrl: `/order-confirmation?order=${encodeURIComponent(existingOrders[0]?.orderNumber || "FB-ORDER")}`,
      });
    }

    const context = await prepareCheckoutContext(claim.attempt.customerId, claim.attempt.payload);

    let paymentReference = "";
    let providerPayload: unknown;

    if (method === "KHALTI" || method === "LOCAL_CARD") {
      if (!body.pidx) {
        return NextResponse.json({ error: "Missing Khalti payment reference." }, { status: 400 });
      }

      const verified = await verifyKhaltiPayment({
        pidx: body.pidx,
        expectedAmount: context.grandTotal,
      });
      paymentReference = verified.reference;
      providerPayload = verified.payload;
    } else if (method === "ESEWA") {
      if (!body.encodedData) {
        return NextResponse.json({ error: "Missing eSewa response payload." }, { status: 400 });
      }

      const verified = await verifyEsewaPayment({
        encodedData: body.encodedData,
        expectedAmount: context.grandTotal,
      });
      paymentReference = verified.reference;
      providerPayload = verified.payload;
    } else if (method === "CONNECTIPS") {
      if (!body.transactionId) {
        return NextResponse.json({ error: "Missing connectIPS transaction id." }, { status: 400 });
      }

      const verified = await verifyConnectIpsPayment({
        transactionId: body.transactionId,
        expectedAmount: context.grandTotal,
      });
      paymentReference = verified.reference;
      providerPayload = verified.payload;
    } else {
      if (!body.transactionId) {
        return NextResponse.json({ error: "Missing Fonepay transaction id." }, { status: 400 });
      }

      const verified = await verifyFonepayPayment({
        transactionId: body.transactionId,
        expectedAmount: context.grandTotal,
      });
      paymentReference = verified.reference;
      providerPayload = verified.payload;
    }

    const orders = await createOrdersFromCheckoutPayload({
      context,
      paymentReference,
      checkoutGroupId: claim.attempt.checkoutId,
    });
    await finalizePaymentAttempt({
      checkoutId: claim.attempt.checkoutId,
      providerReference: paymentReference,
      providerPayload,
    }).catch(() => undefined);

    return NextResponse.json({
      success: true,
      orders,
      redirectUrl: `/order-confirmation?order=${encodeURIComponent(orders[0]?.orderNumber || "FB-ORDER")}`,
    });
  } catch (error) {
    console.error("Error confirming payment:", error);
    if (body?.token) {
      await failPaymentAttemptByToken(body.token).catch(() => undefined);
    }
    const mapped = mapCheckoutErrorToResponse(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
