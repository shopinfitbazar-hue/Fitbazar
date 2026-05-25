import assert from "node:assert/strict";
import { categoryQueryValue, normalizeCategory } from "../src/lib/categories";
import { runCartStateTests } from "./cart-state.test";
import { getGoogleOAuthCallbackUrls, hasConfiguredGoogleOAuth } from "../src/lib/google-auth";
import { hasConfiguredMailTransport } from "../src/lib/mailer";
import { getSafeImageUrl } from "../src/lib/media";
import { hasConfiguredConnectIps, hasConfiguredEsewa, hasConfiguredFonepay, hasConfiguredKhalti, hasConfiguredLocalCards } from "../src/lib/payment-config";
import { allocateAmountAcrossSubtotals, calculateOrderAmounts, groupItemsByVendor } from "../src/lib/order-routing";
import { isSupportedPaymentMethod, mapProviderMethod } from "../src/lib/payment-types";
import { deriveProductStatus } from "../src/lib/product-status";
import { getDeliveryMessage, isValidNepalPincode, resolvePincode } from "../src/lib/pincode";
import { getShippingAmount } from "../src/lib/shipping";
import { buildAppUrl, hashOpaqueToken } from "../src/lib/tokens";
import { t } from "../src/lib/translations";
import { getVendorAccessState } from "../src/lib/vendor-access";

function run(name: string, fn: () => void) {
  fn();
  console.log(`PASS ${name}`);
}

function restoreEnv(previous: Record<string, string | undefined>) {
  Object.entries(previous).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
      return;
    }

    process.env[key] = value;
  });
}

runCartStateTests(run);

run("category aliases normalize to canonical values", () => {
  assert.equal(normalizeCategory("men"), "Men");
  assert.equal(normalizeCategory("sports"), "Sportswear");
  assert.equal(categoryQueryValue("ethnic"), "Ethnic Wear");
});

run("translation fallback stays safe", () => {
  assert.equal(t("home", "ne"), "गृहपृष्ठ");
  assert.equal(t("missing_key", "en"), "missing_key");
});

run("vendor access state blocks pending and suspended vendors", () => {
  assert.deepEqual(getVendorAccessState({ isApproved: true, isSuspended: false }), { canOperate: true, reason: null });
  assert.equal(getVendorAccessState({ isApproved: false, isSuspended: false }).reason, "Vendor pending approval");
  assert.equal(getVendorAccessState({ isApproved: true, isSuspended: true }).reason, "Vendor suspended");
});

run("order routing groups items by vendor and preserves totals", () => {
  const grouped = groupItemsByVendor([
    { productId: "p1", vendorId: "v1", price: 1000, quantity: 1 },
    { productId: "p2", vendorId: "v2", price: 1500, quantity: 2 },
    { productId: "p3", vendorId: "v1", price: 800, quantity: 1 },
  ]);
  assert.equal(grouped.v1.length, 2);
  assert.equal(grouped.v2.length, 1);

  const amounts = calculateOrderAmounts({
    items: grouped.v1,
    commissionPct: 8,
    couponDiscountPct: 10,
    shippingAmount: 100,
  });
  assert.equal(amounts.subtotal, 1800);
  assert.equal(amounts.totalAmount, 1720);
  assert.equal(amounts.commissionAmt, 144);
});

run("order routing allocations stay balanced across vendors", () => {
  const allocations = allocateAmountAcrossSubtotals(350, [1000, 2000, 500]);
  assert.equal(allocations.length, 3);
  assert.equal(allocations.reduce((sum, value) => sum + value, 0), 350);
});

run("pincode validation resolves Nepal delivery messaging", () => {
  assert.equal(isValidNepalPincode("44600"), true);
  assert.equal(isValidNepalPincode("1234"), false);
  const delivery = getDeliveryMessage("44600", new Date("2026-03-20T00:00:00Z"));
  assert.equal(delivery.ok, true);
  assert.match(delivery.message, /Kathmandu/);
});

run("unknown pincodes no longer collapse into Kathmandu by default", () => {
  const resolved = resolvePincode("44900");
  assert.equal(resolved?.district, "Other Nepal");
  assert.equal(resolved?.zone, "Other Nepal");
});

run("google oauth config detection rejects placeholders", () => {
  assert.equal(
    hasConfiguredGoogleOAuth({ clientId: "your-google-client-id", clientSecret: "your-google-client-secret" }),
    false,
  );
  assert.equal(
    hasConfiguredGoogleOAuth({ clientId: "your_google_client_id", clientSecret: "your_google_client_secret" }),
    false,
  );
  assert.equal(
    hasConfiguredGoogleOAuth({ clientId: "real-client-id.apps.googleusercontent.com", clientSecret: "real-secret" }),
    true,
  );
});

run("google callback urls are derived from NEXTAUTH_URL safely", () => {
  const urls = getGoogleOAuthCallbackUrls("http://localhost:3002/");
  assert.equal(urls.nextAuthCallback, "http://localhost:3002/api/auth/callback/google");
  assert.equal(urls.loginPage, "http://localhost:3002/login");
});

run("absolute app urls fall back to Vercel envs safely", () => {
  const previous = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    SITE_URL: process.env.SITE_URL,
    APP_URL: process.env.APP_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    VERCEL_URL: process.env.VERCEL_URL,
  };

  delete process.env.NEXTAUTH_URL;
  delete process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.SITE_URL;
  delete process.env.APP_URL;
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  process.env.VERCEL_URL = "fitbazar.vercel.app";
  assert.equal(buildAppUrl("/verify-email"), "https://fitbazar.vercel.app/verify-email");

  restoreEnv(previous);
});

run("absolute app urls prefer canonical site url over local NextAuth in production", () => {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    SITE_URL: process.env.SITE_URL,
    APP_URL: process.env.APP_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL: process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
  };

  Object.assign(process.env, { NODE_ENV: "production" });
  process.env.NEXTAUTH_URL = "http://localhost:3002";
  process.env.NEXT_PUBLIC_SITE_URL = "https://fit-bazar.com";
  delete process.env.SITE_URL;
  delete process.env.APP_URL;
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  delete process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  delete process.env.VERCEL_URL;
  delete process.env.NEXT_PUBLIC_VERCEL_URL;

  assert.equal(buildAppUrl("/reset-password"), "https://fit-bazar.com/reset-password");

  restoreEnv(previous);
});

run("mail transport config rejects missing and placeholder Resend keys", () => {
  const previous = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  };

  delete process.env.RESEND_API_KEY;
  assert.equal(hasConfiguredMailTransport(), false);

  process.env.RESEND_API_KEY = "your-resend-api-key";
  assert.equal(hasConfiguredMailTransport(), false);

  process.env.RESEND_API_KEY = "re_real_secret";
  assert.equal(hasConfiguredMailTransport(), true);

  restoreEnv(previous);
});

run("safe image urls reject local machine hosts and malformed values", () => {
  const fallback = "https://picsum.photos/seed/fallback/900/1200";
  assert.equal(getSafeImageUrl("http://localhost:3000/uploads/demo.jpg", fallback), fallback);
  assert.equal(getSafeImageUrl("not-a-url", fallback), fallback);
  assert.equal(getSafeImageUrl("/images/local-banner.jpg", fallback), "/images/local-banner.jpg");
  assert.equal(getSafeImageUrl("https://images.example.com/banner.jpg", fallback), "https://images.example.com/banner.jpg");
});

run("token hashing is deterministic and opaque", () => {
  const token = "sample-reset-token";
  const first = hashOpaqueToken(token);
  const second = hashOpaqueToken(token);
  assert.equal(first, second);
  assert.notEqual(first, token);
});

run("shipping logic respects delivery type and free-delivery threshold", () => {
  assert.equal(getShippingAmount({ subtotal: 2500, deliveryMethod: "standard", freeDeliveryThreshold: 2000 }), 0);
  assert.equal(getShippingAmount({ subtotal: 900, deliveryMethod: "express", freeDeliveryThreshold: 2000 }), 250);
  assert.equal(getShippingAmount({ subtotal: 900, deliveryMethod: "pickup", freeDeliveryThreshold: 2000 }), 0);
});

run("product status derivation keeps hidden, draft, and stock rules deterministic", () => {
  assert.equal(deriveProductStatus({ requestedStatus: "ACTIVE", stock: 8 }), "ACTIVE");
  assert.equal(deriveProductStatus({ requestedStatus: "ACTIVE", stock: 0 }), "OUT_OF_STOCK");
  assert.equal(deriveProductStatus({ requestedStatus: "HIDDEN", stock: 12 }), "HIDDEN");
  assert.equal(deriveProductStatus({ requestedStatus: "DRAFT", stock: 12 }), "DRAFT");
  assert.equal(deriveProductStatus({ stock: 0, isActive: true }), "OUT_OF_STOCK");
});

run("payment methods hide cleanly when env vars are missing", () => {
  const env = {
    KHALTI_SECRET_KEY: "",
    ESEWA_PRODUCT_CODE: "",
    ESEWA_SECRET_KEY: "",
    CONNECTIPS_MERCHANT_ID: "",
    CONNECTIPS_APP_ID: "",
    CONNECTIPS_GATEWAY_URL: "",
    CONNECTIPS_VERIFY_URL: "",
    FONEPAY_MERCHANT_CODE: "",
    FONEPAY_GATEWAY_URL: "",
    FONEPAY_VERIFY_URL: "",
    KHALTI_ENABLE_LOCAL_CARD: "false",
  };

  assert.equal(hasConfiguredKhalti(env), false);
  assert.equal(hasConfiguredEsewa(env), false);
  assert.equal(hasConfiguredConnectIps(env), false);
  assert.equal(hasConfiguredFonepay(env), false);
  assert.equal(hasConfiguredLocalCards(env), false);
});

run("local cards only show when Khalti and card flag are both enabled", () => {
  const env = {
    KHALTI_SECRET_KEY: "live-secret",
    KHALTI_ENABLE_LOCAL_CARD: "true",
  };

  assert.equal(hasConfiguredLocalCards(env), true);
});

run("supported payment methods stay constrained and human-readable", () => {
  assert.equal(isSupportedPaymentMethod("COD"), true);
  assert.equal(isSupportedPaymentMethod("BANK_TRANSFER"), false);
  assert.equal(mapProviderMethod("LOCAL_CARD"), "Local Cards");
  assert.equal(mapProviderMethod("CONNECTIPS"), "connectIPS");
  assert.equal(mapProviderMethod("KHALTI"), "KHALTI");
});

console.log("All launch guardrail tests passed.");
