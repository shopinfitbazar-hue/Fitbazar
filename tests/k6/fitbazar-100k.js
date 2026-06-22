import http from "k6/http";
import { check, sleep } from "k6";
import exec from "k6/execution";

const TARGET_URL = (__ENV.TARGET_URL || "").replace(/\/$/, "");
const PROFILE = String(__ENV.K6_PROFILE || "smoke").toLowerCase();
const CONFIRMED = __ENV.CONFIRM_DISTRIBUTED_LOAD_TEST === "YES";
const USER_AGENT = `fitbazar-k6-${PROFILE}/1.0`;

const profiles = {
  smoke: {
    stages: [
      { duration: "30s", target: 5 },
      { duration: "30s", target: 5 },
      { duration: "15s", target: 0 },
    ],
  },
  "1000": {
    stages: [
      { duration: "10m", target: 1000 },
      { duration: "20m", target: 1000 },
      { duration: "5m", target: 0 },
    ],
  },
  "5000": {
    stages: [
      { duration: "20m", target: 5000 },
      { duration: "30m", target: 5000 },
      { duration: "10m", target: 0 },
    ],
  },
  "10000": {
    stages: [
      { duration: "30m", target: 10000 },
      { duration: "30m", target: 10000 },
      { duration: "15m", target: 0 },
    ],
  },
  "25000": {
    stages: [
      { duration: "45m", target: 25000 },
      { duration: "45m", target: 25000 },
      { duration: "20m", target: 0 },
    ],
  },
  "50000": {
    stages: [
      { duration: "60m", target: 50000 },
      { duration: "45m", target: 50000 },
      { duration: "30m", target: 0 },
    ],
  },
  "100000": {
    stages: [
      { duration: "90m", target: 100000 },
      { duration: "60m", target: 100000 },
      { duration: "45m", target: 0 },
    ],
  },
};

if (!TARGET_URL) {
  throw new Error("TARGET_URL is required, for example TARGET_URL=https://staging.fit-bazar.com");
}

if (!profiles[PROFILE]) {
  throw new Error(`Unknown K6_PROFILE "${PROFILE}". Use smoke, 1000, 5000, 10000, 25000, 50000, or 100000.`);
}

if (PROFILE !== "smoke" && !CONFIRMED) {
  throw new Error("Set CONFIRM_DISTRIBUTED_LOAD_TEST=YES to run non-smoke k6 profiles.");
}

if ((PROFILE === "50000" || PROFILE === "100000") && __ENV.K6_DISTRIBUTED_RUN !== "YES") {
  throw new Error("50k and 100k profiles require K6_DISTRIBUTED_RUN=YES and a distributed runner/cloud plan.");
}

export const options = {
  scenarios: {
    fitbazar_user_journey: {
      executor: "ramping-vus",
      gracefulRampDown: "60s",
      stages: profiles[PROFILE].stages,
    },
  },
  thresholds: {
    http_req_failed: [{ threshold: "rate<0.01", abortOnFail: true, delayAbortEval: "2m" }],
    http_req_duration: ["p(95)<800", "p(99)<1500"],
    checks: ["rate>0.99"],
  },
  userAgent: USER_AGENT,
  noVUConnectionReuse: false,
  discardResponseBodies: __ENV.K6_DISCARD_BODIES !== "false",
};

function splitList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const productSlugs = splitList(__ENV.K6_PRODUCT_SLUGS);
const vendorSlugs = splitList(__ENV.K6_VENDOR_SLUGS);
const searchTerms = splitList(__ENV.K6_SEARCH_TERMS || "shirt,kurta,jacket,watch,bag");

function url(path) {
  return `${TARGET_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function get(path, tags = {}) {
  const response = http.get(url(path), {
    headers: { "User-Agent": USER_AGENT },
    tags: { path, ...tags },
    timeout: __ENV.K6_TIMEOUT || "10s",
  });

  check(response, {
    "status is expected": (res) => res.status >= 200 && res.status < 400,
  });

  return response;
}

function authHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "User-Agent": USER_AGENT,
    "Idempotency-Key": `k6-${exec.vu.idInTest}-${exec.vu.iterationInInstance}-${Date.now()}`,
  };
}

export function setup() {
  if (!__ENV.TEST_CUSTOMER_EMAIL || !__ENV.TEST_CUSTOMER_PASSWORD) return {};

  const response = http.post(
    url("/api/mobile/v1/auth/login"),
    JSON.stringify({
      email: __ENV.TEST_CUSTOMER_EMAIL,
      password: __ENV.TEST_CUSTOMER_PASSWORD,
      app: "CUSTOMER_APP",
      deviceId: `k6-${PROFILE}-${Date.now()}`,
    }),
    {
      headers: { "Content-Type": "application/json", "User-Agent": USER_AGENT },
      timeout: "15s",
      tags: { path: "/api/mobile/v1/auth/login" },
    },
  );

  check(response, {
    "customer login succeeded": (res) => res.status === 200 && Boolean(res.json("accessToken")),
  });

  return {
    customerAccessToken: response.status === 200 ? response.json("accessToken") : null,
  };
}

function publicBrowseJourney() {
  const iteration = exec.scenario.iterationInTest;
  const term = searchTerms[iteration % searchTerms.length] || "shirt";
  const batch = [
    ["GET", url("/"), null, { tags: { path: "/" }, timeout: "10s" }],
    ["GET", url("/products"), null, { tags: { path: "/products" }, timeout: "10s" }],
    ["GET", url("/api/products?limit=24&page=1"), null, { tags: { path: "/api/products" }, timeout: "10s" }],
    ["GET", url(`/api/search?q=${encodeURIComponent(term)}&limit=12&page=1`), null, { tags: { path: "/api/search" }, timeout: "10s" }],
    ["GET", url("/api/vendors?limit=12&page=1"), null, { tags: { path: "/api/vendors" }, timeout: "10s" }],
    ["GET", url("/api/categories"), null, { tags: { path: "/api/categories" }, timeout: "10s" }],
    ["GET", url("/api/site-settings"), null, { tags: { path: "/api/site-settings" }, timeout: "10s" }],
  ];

  const responses = http.batch(batch);
  responses.forEach((response) => {
    check(response, {
      "public response expected": (res) => res.status >= 200 && res.status < 400,
    });
  });

  if (productSlugs.length) {
    get(`/api/products/${encodeURIComponent(productSlugs[iteration % productSlugs.length])}`, {
      path: "/api/products/[slug]",
    });
  }

  if (vendorSlugs.length) {
    get(`/api/vendors/${encodeURIComponent(vendorSlugs[iteration % vendorSlugs.length])}`, {
      path: "/api/vendors/[slug]",
    });
  }
}

function authenticatedCustomerJourney(data) {
  if (!data.customerAccessToken) return;

  const response = http.get(url("/api/mobile/v1/auth/me"), {
    headers: authHeaders(data.customerAccessToken),
    tags: { path: "/api/mobile/v1/auth/me" },
    timeout: "10s",
  });
  check(response, {
    "mobile auth me expected": (res) => res.status === 200 || res.status === 401,
  });

  if (__ENV.ENABLE_ORDER_CREATION !== "YES") return;
  if (!__ENV.TEST_PRODUCT_ID) return;

  const orderResponse = http.post(
    url("/api/mobile/v1/customer/orders"),
    JSON.stringify({
      items: [{ productId: __ENV.TEST_PRODUCT_ID, quantity: 1 }],
      address: {
        name: "FitBazar Load Test",
        phone: "9800000000",
        line1: "Staging load test address",
        zone: "Kathmandu",
        district: "Kathmandu",
        pincode: "44600",
      },
      paymentMethod: "COD",
      deliveryMethod: "standard",
    }),
    {
      headers: authHeaders(data.customerAccessToken),
      tags: { path: "/api/mobile/v1/customer/orders" },
      timeout: "15s",
    },
  );
  check(orderResponse, {
    "optional order path expected": (res) => res.status === 200 || res.status === 400 || res.status === 409,
  });
}

export default function (data) {
  const selector = exec.scenario.iterationInTest % 100;

  if (selector < 85) {
    publicBrowseJourney();
  } else {
    authenticatedCustomerJourney(data);
  }

  sleep(Number(__ENV.K6_THINK_SECONDS || 1));
}
