type PaymentEnv = Partial<Record<string, string | undefined>>;

function hasRealValue(value?: string) {
  return Boolean(value && !value.startsWith("your_") && value !== "placeholder");
}

export function hasConfiguredKhalti(env: PaymentEnv = process.env) {
  return hasRealValue(env.KHALTI_SECRET_KEY);
}

export function hasConfiguredEsewa(env: PaymentEnv = process.env) {
  return hasRealValue(env.ESEWA_PRODUCT_CODE || env.ESEWA_MERCHANT_CODE) && hasRealValue(env.ESEWA_SECRET_KEY);
}

export function hasConfiguredConnectIps(env: PaymentEnv = process.env) {
  return hasRealValue(env.CONNECTIPS_MERCHANT_ID) && hasRealValue(env.CONNECTIPS_APP_ID) && hasRealValue(env.CONNECTIPS_GATEWAY_URL) && hasRealValue(env.CONNECTIPS_VERIFY_URL);
}

export function hasConfiguredFonepay(env: PaymentEnv = process.env) {
  return hasRealValue(env.FONEPAY_MERCHANT_CODE) && hasRealValue(env.FONEPAY_GATEWAY_URL) && hasRealValue(env.FONEPAY_VERIFY_URL);
}

export function hasConfiguredLocalCards(env: PaymentEnv = process.env) {
  return hasConfiguredKhalti(env) && env.KHALTI_ENABLE_LOCAL_CARD === "true";
}
