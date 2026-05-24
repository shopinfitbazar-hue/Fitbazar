import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { CheckoutPayload, PreparedCheckoutContext } from "@/lib/checkout-server";
import { hasConfiguredEsewa, hasConfiguredKhalti } from "@/lib/payment-config";
import { createOpaqueToken, hashOpaqueToken } from "@/lib/tokens";
import type { SupportedPaymentMethod } from "@/lib/payment-types";

type StoredPaymentPayload = CheckoutPayload & {
  checkoutId: string;
  customerId: string;
  createdAt: string;
};

export type PaymentAttemptRecord = {
  id: string;
  checkoutId: string;
  customerId: string;
  paymentMethod: SupportedPaymentMethod;
  amount: number;
  currency: string;
  tokenHash: string;
  payload: StoredPaymentPayload;
  status: string;
  providerReference: string | null;
  providerPayload: unknown;
  expiresAt: Date;
  completedAt: Date | null;
};

function ensureAbsoluteBaseUrl() {
  return (process.env.NEXTAUTH_URL || "http://localhost:3002").replace(/\/$/, "");
}

function normalizeStoredPayload(value: unknown): StoredPaymentPayload {
  return value as StoredPaymentPayload;
}

export function buildCheckoutId() {
  return crypto.randomUUID();
}

export function getKhaltiApiBaseUrl() {
  return process.env.KHALTI_API_BASE_URL || (process.env.NODE_ENV === "production" ? "https://khalti.com/api/v2" : "https://dev.khalti.com/api/v2");
}

export function getEsewaBaseUrl() {
  return process.env.ESEWA_BASE_URL || (process.env.NODE_ENV === "production" ? "https://epay.esewa.com.np" : "https://rc-epay.esewa.com.np");
}

export function getEsewaStatusBaseUrl() {
  return process.env.ESEWA_STATUS_BASE_URL || (process.env.NODE_ENV === "production" ? "https://esewa.com.np" : "https://rc.esewa.com.np");
}

export async function createPaymentAttempt(input: {
  checkoutId: string;
  customerId: string;
  paymentMethod: SupportedPaymentMethod;
  amount: number;
  payload: StoredPaymentPayload;
}) {
  const rawToken = createOpaqueToken();
  const tokenHash = hashOpaqueToken(rawToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

  const attempt = await prisma.paymentAttempt.create({
    data: {
      checkoutId: input.checkoutId,
      customerId: input.customerId,
      paymentMethod: input.paymentMethod,
      amount: input.amount,
      currency: "NPR",
      tokenHash,
      payload: input.payload,
      expiresAt,
      status: "PENDING",
    },
  });

  return {
    ...attempt,
    payload: normalizeStoredPayload(attempt.payload),
    token: rawToken,
  };
}

export async function loadPaymentAttemptByToken(token: string): Promise<PaymentAttemptRecord | null> {
  const attempt = await prisma.paymentAttempt.findUnique({
    where: {
      tokenHash: hashOpaqueToken(token),
    },
  });

  if (!attempt || attempt.expiresAt <= new Date()) {
    return null;
  }

  return {
    ...attempt,
    paymentMethod: attempt.paymentMethod as SupportedPaymentMethod,
    payload: normalizeStoredPayload(attempt.payload),
  };
}

export async function cancelPaymentAttemptByToken(token: string) {
  await prisma.paymentAttempt.updateMany({
    where: {
      tokenHash: hashOpaqueToken(token),
      status: {
        in: ["PENDING", "PROCESSING"],
      },
    },
    data: {
      status: "CANCELLED",
    },
  });
}

export async function failPaymentAttemptByToken(token: string, providerPayload?: unknown) {
  await prisma.paymentAttempt.updateMany({
    where: {
      tokenHash: hashOpaqueToken(token),
      status: {
        in: ["PENDING", "PROCESSING"],
      },
    },
    data: {
      status: "FAILED",
      providerPayload: providerPayload as never,
    },
  });
}

export async function claimPaymentAttempt(input: {
  token: string;
  expectedMethod: SupportedPaymentMethod;
}) {
  const tokenHash = hashOpaqueToken(input.token);
  const existing = await prisma.paymentAttempt.findUnique({
    where: {
      tokenHash,
    },
  });

  if (!existing || existing.expiresAt <= new Date()) {
    return { state: "expired" as const };
  }

  if (existing.paymentMethod !== input.expectedMethod) {
    return { state: "invalid" as const };
  }

  const existingOrders = await prisma.order.findMany({
    where: {
      checkoutGroupId: existing.checkoutId,
    },
    include: {
      items: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (existingOrders.length) {
    return {
      state: "succeeded" as const,
      attempt: {
        ...existing,
        paymentMethod: existing.paymentMethod as SupportedPaymentMethod,
        payload: normalizeStoredPayload(existing.payload),
      },
      orders: existingOrders,
    };
  }

  if (existing.status === "SUCCEEDED") {
    return {
      state: "succeeded" as const,
      attempt: {
        ...existing,
        paymentMethod: existing.paymentMethod as SupportedPaymentMethod,
        payload: normalizeStoredPayload(existing.payload),
      },
    };
  }

  if (existing.status === "PROCESSING") {
    return { state: "processing" as const };
  }

  if (existing.status === "FAILED" || existing.status === "CANCELLED") {
    return { state: "failed" as const };
  }

  const claimed = await prisma.paymentAttempt.updateMany({
    where: {
      id: existing.id,
      status: "PENDING",
    },
    data: {
      status: "PROCESSING",
    },
  });

  if (!claimed.count) {
    return { state: "processing" as const };
  }

  return {
    state: "claimed" as const,
    attempt: {
      ...existing,
      paymentMethod: existing.paymentMethod as SupportedPaymentMethod,
      payload: normalizeStoredPayload(existing.payload),
    },
  };
}

export async function finalizePaymentAttempt(input: {
  checkoutId: string;
  providerReference: string;
  providerPayload?: unknown;
}) {
  return prisma.paymentAttempt.update({
    where: {
      checkoutId: input.checkoutId,
    },
    data: {
      status: "SUCCEEDED",
      providerReference: input.providerReference,
      providerPayload: input.providerPayload as never,
      completedAt: new Date(),
    },
  });
}

export async function clearExpiredPaymentAttempts() {
  await prisma.paymentAttempt.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
      status: {
        in: ["PENDING", "FAILED", "CANCELLED"],
      },
    },
  });
}

function signEsewaMessage(message: string, secretKey: string) {
  return crypto.createHmac("sha256", secretKey).update(message).digest("base64");
}

function buildGatewayUrls(method: SupportedPaymentMethod, token: string) {
  const base = ensureAbsoluteBaseUrl();
  return {
    returnUrl: `${base}/checkout/complete?method=${encodeURIComponent(method)}&token=${encodeURIComponent(token)}`,
    cancelUrl: `${base}/checkout?paymentCanceled=1`,
    websiteUrl: `${base}/`,
  };
}

export async function initiateKhaltiPayment(input: {
  paymentMethod: "KHALTI" | "LOCAL_CARD";
  checkoutId: string;
  paymentToken: string;
  context: PreparedCheckoutContext;
}) {
  const secretKey = process.env.KHALTI_SECRET_KEY;

  if (!hasConfiguredKhalti() || !secretKey) {
    throw new Error("Khalti is not configured yet. Add KHALTI_SECRET_KEY before enabling Khalti checkout.");
  }

  const urls = buildGatewayUrls(input.paymentMethod, input.paymentToken);
  const amount = Math.round(input.context.grandTotal * 100);
  const response = await fetch(`${getKhaltiApiBaseUrl()}/epayment/initiate/`, {
    method: "POST",
    headers: {
      Authorization: `Key ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      return_url: urls.returnUrl,
      website_url: urls.websiteUrl,
      amount,
      purchase_order_id: input.checkoutId,
      purchase_order_name:
        input.paymentMethod === "LOCAL_CARD"
          ? `Fit Bazar Local Card ${input.checkoutId.slice(0, 8)}`
          : `Fit Bazar Order ${input.checkoutId.slice(0, 8)}`,
      customer_info: {
        name: input.context.address.name,
        email: input.context.address.email || undefined,
        phone: input.context.address.phone,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok || !data?.payment_url || !data?.pidx) {
    throw new Error(data?.detail || data?.error_key || "Unable to initiate Khalti payment.");
  }

  return {
    provider: "KHALTI" as const,
    redirectUrl: data.payment_url as string,
    reference: data.pidx as string,
    payload: data,
  };
}

export async function verifyKhaltiPayment(input: {
  pidx: string;
  expectedAmount: number;
}) {
  const secretKey = process.env.KHALTI_SECRET_KEY;

  if (!hasConfiguredKhalti() || !secretKey) {
    throw new Error("Khalti is not configured yet.");
  }

  const response = await fetch(`${getKhaltiApiBaseUrl()}/epayment/lookup/`, {
    method: "POST",
    headers: {
      Authorization: `Key ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pidx: input.pidx,
    }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.detail || "Unable to verify Khalti payment.");
  }

  if (data?.status !== "Completed") {
    throw new Error(`Khalti payment is ${data?.status || "not completed"}.`);
  }

  if (Number(data.total_amount) !== Math.round(input.expectedAmount * 100)) {
    throw new Error("Khalti payment amount mismatch.");
  }

  return {
    reference: data.transaction_id || data.pidx,
    payload: data,
  };
}

export async function initiateEsewaPayment(input: {
  checkoutId: string;
  paymentToken: string;
  context: PreparedCheckoutContext;
}) {
  const productCode = process.env.ESEWA_PRODUCT_CODE || process.env.ESEWA_MERCHANT_CODE;
  const secretKey = process.env.ESEWA_SECRET_KEY;

  if (!hasConfiguredEsewa() || !productCode || !secretKey) {
    throw new Error("eSewa is not configured yet. Add ESEWA_PRODUCT_CODE and ESEWA_SECRET_KEY before enabling eSewa checkout.");
  }

  const urls = buildGatewayUrls("ESEWA", input.paymentToken);
  const totalAmount = Number(input.context.grandTotal.toFixed(2));
  const transactionUuid = input.checkoutId;
  const signedFieldNames = "total_amount,transaction_uuid,product_code";
  const signature = signEsewaMessage(
    `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`,
    secretKey,
  );

  return {
    provider: "ESEWA" as const,
    formAction: `${getEsewaBaseUrl()}/api/epay/main/v2/form`,
    fields: {
      amount: String(Number((input.context.subtotal - input.context.couponDiscountTotal).toFixed(2))),
      tax_amount: "0",
      total_amount: String(totalAmount),
      transaction_uuid: transactionUuid,
      product_code: productCode,
      product_service_charge: "0",
      product_delivery_charge: String(Number(input.context.shippingAmount.toFixed(2))),
      success_url: urls.returnUrl,
      failure_url: `${urls.returnUrl}&status=FAILED`,
      signed_field_names: signedFieldNames,
      signature,
    },
    reference: transactionUuid,
  };
}

function verifyEsewaSignature(payload: Record<string, string>, secretKey: string) {
  const signedFields = payload.signed_field_names.split(",");
  const message = signedFields.map((fieldName) => `${fieldName}=${payload[fieldName] || ""}`).join(",");
  const expectedSignature = signEsewaMessage(message, secretKey);
  const actualSignature = payload.signature || "";

  if (actualSignature.length !== expectedSignature.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(actualSignature));
}

export async function verifyEsewaPayment(input: {
  encodedData: string;
  expectedAmount: number;
}) {
  const productCode = process.env.ESEWA_PRODUCT_CODE || process.env.ESEWA_MERCHANT_CODE;
  const secretKey = process.env.ESEWA_SECRET_KEY;

  if (!hasConfiguredEsewa() || !productCode || !secretKey) {
    throw new Error("eSewa is not configured yet.");
  }

  const decoded = Buffer.from(input.encodedData, "base64").toString("utf8");
  const payload = JSON.parse(decoded) as Record<string, string>;

  if (payload.status !== "COMPLETE") {
    throw new Error(`eSewa payment is ${payload.status || "not complete"}.`);
  }

  if (!verifyEsewaSignature(payload, secretKey)) {
    throw new Error("Invalid eSewa payment signature.");
  }

  const statusResponse = await fetch(
    `${getEsewaStatusBaseUrl()}/api/epay/transaction/status/?product_code=${encodeURIComponent(productCode)}&total_amount=${encodeURIComponent(payload.total_amount)}&transaction_uuid=${encodeURIComponent(payload.transaction_uuid)}`,
    {
      cache: "no-store",
    },
  );
  const statusPayload = await statusResponse.json();

  if (!statusResponse.ok || statusPayload.status !== "COMPLETE") {
    throw new Error(`eSewa payment status is ${statusPayload.status || "unknown"}.`);
  }

  if (Number(payload.total_amount) !== Number(input.expectedAmount.toFixed(2))) {
    throw new Error("eSewa payment amount mismatch.");
  }

  return {
    reference: statusPayload.ref_id || payload.transaction_code || payload.transaction_uuid,
    payload: {
      callback: payload,
      status: statusPayload,
    },
  };
}

export async function initiateConnectIpsPayment(input: {
  checkoutId: string;
  paymentToken: string;
  context: PreparedCheckoutContext;
}): Promise<{ redirectUrl: string; reference: string }> {
  void input;
  throw new Error(
    "connectIPS is not wired yet in this environment. Add official merchant credentials and endpoint details to enable the connectIPS hosted payment flow.",
  );
}

export async function verifyConnectIpsPayment(input: {
  transactionId: string;
  expectedAmount: number;
}): Promise<{ reference: string; payload: unknown }> {
  void input;
  throw new Error(
    "connectIPS verification is not wired yet in this environment. Add official merchant credentials and endpoint details to enable server-side verification.",
  );
}

export async function initiateFonepayPayment(input: {
  checkoutId: string;
  paymentToken: string;
  context: PreparedCheckoutContext;
}): Promise<{ redirectUrl: string; reference: string }> {
  void input;
  throw new Error(
    "Fonepay is not wired yet in this environment. Add official merchant credentials and endpoint details to enable the Fonepay payment flow.",
  );
}

export async function verifyFonepayPayment(input: {
  transactionId: string;
  expectedAmount: number;
}): Promise<{ reference: string; payload: unknown }> {
  void input;
  throw new Error(
    "Fonepay verification is not wired yet in this environment. Add official merchant credentials and endpoint details to enable server-side verification.",
  );
}
