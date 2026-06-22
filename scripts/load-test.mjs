#!/usr/bin/env node

const help = process.argv.includes("--help") || process.argv.includes("-h");

if (help) {
  console.log(`
Fit Bazar load smoke runner

Environment:
  LOAD_TEST_BASE_URL          Target origin. Default: http://localhost:3002
  LOAD_TEST_PATHS             Comma-separated paths. Default covers storefront APIs.
  LOAD_TEST_CONCURRENCY       Parallel workers. Default: 25
  LOAD_TEST_DURATION_SECONDS  Test duration. Default: 30
  LOAD_TEST_TIMEOUT_MS        Per-request timeout. Default: 10000
  LOAD_TEST_COOKIE            Optional Cookie header for admin/authenticated paths.
  LOAD_TEST_METHOD            HTTP method. Default: GET
  LOAD_TEST_READ_BODY         Set false to skip response body downloads. Default: true
  LOAD_TEST_EXPECTED_STATUSES Comma-separated success statuses. Default: 200-399
  LOAD_TEST_RAMP_SECONDS      Gradually start workers across this many seconds. Default: 0
  LOAD_TEST_THINK_MS          Delay after each request per worker. Default: 0
  LOAD_TEST_JITTER_MS         Random extra delay after each request. Default: 0
  LOAD_TEST_MAX_P95_MS        Fail if p95 latency exceeds this. Default: 1500
  LOAD_TEST_ALLOWED_FAILURE_RATE  Fail if failures exceed this ratio. Default: 0.01

Example:
  LOAD_TEST_BASE_URL=https://fit-bazar.com \\
  LOAD_TEST_CONCURRENCY=100 \\
  LOAD_TEST_DURATION_SECONDS=60 \\
  npm run load:test

Admin example:
  LOAD_TEST_BASE_URL=https://fit-bazar.com \\
  LOAD_TEST_COOKIE='next-auth.session-token=...' \\
  LOAD_TEST_PATHS='/api/admin/vendors?page=1&pageSize=25,/api/admin/products?page=1&pageSize=25&q=shirt,/api/admin/customers?page=1&pageSize=25&q=krish' \\
  npm run load:test
`);
  process.exit(0);
}

const baseUrl = process.env.LOAD_TEST_BASE_URL || "http://localhost:3002";
const paths = (process.env.LOAD_TEST_PATHS || "/,/products,/api/products,/api/search?q=shirt,/api/vendors")
  .split(",")
  .map((path) => path.trim())
  .filter(Boolean);
const concurrency = parseInt(process.env.LOAD_TEST_CONCURRENCY || "25", 10);
const durationMs = parseInt(process.env.LOAD_TEST_DURATION_SECONDS || "30", 10) * 1000;
const timeoutMs = parseInt(process.env.LOAD_TEST_TIMEOUT_MS || "10000", 10);
const maxP95Ms = parseInt(process.env.LOAD_TEST_MAX_P95_MS || "1500", 10);
const allowedFailureRate = Number(process.env.LOAD_TEST_ALLOWED_FAILURE_RATE || "0.01");
const method = (process.env.LOAD_TEST_METHOD || "GET").toUpperCase();
const readBody = process.env.LOAD_TEST_READ_BODY !== "false" && method !== "HEAD";
const rampMs = parseInt(process.env.LOAD_TEST_RAMP_SECONDS || "0", 10) * 1000;
const thinkMs = parseInt(process.env.LOAD_TEST_THINK_MS || "0", 10);
const jitterMs = parseInt(process.env.LOAD_TEST_JITTER_MS || "0", 10);
const expectedStatusTokens = (process.env.LOAD_TEST_EXPECTED_STATUSES || "200-399")
  .split(",")
  .map((status) => status.trim())
  .filter(Boolean);

if (!paths.length) {
  throw new Error("LOAD_TEST_PATHS must contain at least one path.");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function statusMatches(status, token) {
  if (token.includes("-")) {
    const [min, max] = token.split("-").map((part) => parseInt(part, 10));
    return Number.isFinite(min) && Number.isFinite(max) && status >= min && status <= max;
  }

  return status === parseInt(token, 10);
}

function isExpectedStatus(status) {
  return expectedStatusTokens.some((token) => statusMatches(status, token));
}

function percentile(values, p) {
  if (!values.length) return 0;
  const index = Math.min(values.length - 1, Math.ceil((p / 100) * values.length) - 1);
  return values[index];
}

function buildUrl(path) {
  return new URL(path, baseUrl).toString();
}

const startedAt = Date.now();
const stopAt = startedAt + durationMs;
const latencies = [];
const statusCounts = new Map();
let successes = 0;
let failures = 0;
let bytes = 0;

async function request(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();

  try {
    const response = await fetch(buildUrl(path), {
      method,
      headers: {
        "User-Agent": "fit-bazar-load-smoke/1.0",
        ...(process.env.LOAD_TEST_COOKIE ? { Cookie: process.env.LOAD_TEST_COOKIE } : {}),
      },
      redirect: "manual",
      signal: controller.signal,
    });
    if (readBody) {
      const buffer = await response.arrayBuffer();
      bytes += buffer.byteLength;
    } else {
      await response.body?.cancel().catch(() => undefined);
    }
    const elapsed = performance.now() - start;
    latencies.push(elapsed);
    statusCounts.set(response.status, (statusCounts.get(response.status) || 0) + 1);

    if (isExpectedStatus(response.status)) {
      successes += 1;
    } else {
      failures += 1;
    }
  } catch {
    failures += 1;
    latencies.push(performance.now() - start);
    statusCounts.set("network_error", (statusCounts.get("network_error") || 0) + 1);
  } finally {
    clearTimeout(timeout);
  }
}

async function worker(workerId) {
  if (rampMs > 0 && concurrency > 1) {
    await sleep(Math.round((workerId / (concurrency - 1)) * rampMs));
  }

  let index = workerId;
  while (Date.now() < stopAt) {
    await request(paths[index % paths.length]);
    index += concurrency;
    if (thinkMs > 0 || jitterMs > 0) {
      await sleep(thinkMs + Math.floor(Math.random() * Math.max(0, jitterMs)));
    }
  }
}

console.log(`Load smoke starting: ${baseUrl}`);
console.log(`Paths: ${paths.join(", ")}`);
console.log(`Concurrency: ${concurrency}, duration: ${Math.round(durationMs / 1000)}s`);
console.log(`Method: ${method}, read body: ${readBody ? "yes" : "no"}`);
console.log(`Expected statuses: ${expectedStatusTokens.join(", ")}`);
console.log(`Ramp: ${Math.round(rampMs / 1000)}s, think: ${thinkMs}ms, jitter: ${jitterMs}ms`);

await Promise.all(Array.from({ length: concurrency }, (_, index) => worker(index)));

latencies.sort((a, b) => a - b);
const total = successes + failures;
const elapsedSeconds = (Date.now() - startedAt) / 1000;
const failureRate = total ? failures / total : 0;
const p50 = Math.round(percentile(latencies, 50));
const p95 = Math.round(percentile(latencies, 95));
const p99 = Math.round(percentile(latencies, 99));

console.log("\nLoad smoke result");
console.log(`Requests: ${total}`);
console.log(`Successes: ${successes}`);
console.log(`Failures: ${failures}`);
console.log(`Failure rate: ${(failureRate * 100).toFixed(2)}%`);
console.log(`RPS: ${(total / elapsedSeconds).toFixed(2)}`);
console.log(`Latency p50/p95/p99: ${p50}ms / ${p95}ms / ${p99}ms`);
console.log(`Downloaded: ${(bytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`Statuses: ${JSON.stringify(Object.fromEntries(statusCounts), null, 2)}`);

if (p95 > maxP95Ms || failureRate > allowedFailureRate) {
  console.error(`Load smoke failed: p95 <= ${maxP95Ms}ms and failure rate <= ${(allowedFailureRate * 100).toFixed(2)}% required.`);
  process.exit(1);
}
