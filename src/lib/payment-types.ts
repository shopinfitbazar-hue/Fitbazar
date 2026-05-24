export const SUPPORTED_PAYMENT_METHODS = ["COD", "ESEWA", "KHALTI", "CONNECTIPS", "FONEPAY", "LOCAL_CARD"] as const;

export type SupportedPaymentMethod = (typeof SUPPORTED_PAYMENT_METHODS)[number];

export function isSupportedPaymentMethod(value: string): value is SupportedPaymentMethod {
  return SUPPORTED_PAYMENT_METHODS.includes(value as SupportedPaymentMethod);
}

export function mapProviderMethod(method: SupportedPaymentMethod) {
  if (method === "LOCAL_CARD") {
    return "Local Cards";
  }

  if (method === "CONNECTIPS") {
    return "connectIPS";
  }

  if (method === "FONEPAY") {
    return "Fonepay";
  }

  return method;
}
