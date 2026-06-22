# FitBazar 100k Phase 2 Audit

Date: 2026-06-20

Status: not 100k-ready yet. This phase adds safer cache, CDN, database, checkout, and test foundations. 100k readiness still requires production-sized staging data, distributed load generation, real CDN/Neon/Redis metrics, and a written go/no-go review.

FitBazar still uses one backend, one Neon PostgreSQL source of truth, one admin panel, one product/order/vendor/inventory system, and shared web/mobile APIs.

## 1. Redis Cache Audit

Implementation:

- Public catalog/search/vendor APIs use optional Upstash Redis REST through `src/lib/redis-cache.ts`.
- Redis is fail-open. If Redis is missing, slow, or unavailable, the app falls back to the existing Next cache and database path.
- Redis calls use a timeout controlled by `FITBAZAR_REDIS_TIMEOUT_MS`.
- `FITBAZAR_REDIS_CACHE_DISABLED=true` disables Redis without code rollback.
- Cache stampede protection is two-layered:
  - In-process request coalescing for identical cold keys.
  - Short Redis `SET NX EX` lock for cross-instance cold-key protection.
- Invalidation uses versioned keys. `revalidateStorefrontCache()` bumps `fitbazar:version:public`, so new reads use new keys without scanning/deleting old keys.

Keys and TTLs:

- `fitbazar:public:v{version}:products:{sha256}`: 300 seconds.
- `fitbazar:public:v{version}:search:{sha256}`: 120 seconds.
- `fitbazar:public:v{version}:vendors:{sha256}`: 300 seconds.
- `fitbazar:public:v{version}:product-detail:{sha256}`: 300 seconds.
- `fitbazar:public:v{version}:vendor-detail:{sha256}`: 300 seconds.
- `fitbazar:lock:{cacheKey}`: 2-10 seconds.
- `fitbazar:version:public`: no TTL.

Current limitation:

- Redis-backed distributed rate limiting is still not implemented. Middleware rate limiting remains process-local and must be replaced before a real 100k launch.

## 2. CDN And Cache Header Audit

Public read APIs now use:

- `Cache-Control: public, s-maxage=..., stale-while-revalidate=...`
- `CDN-Cache-Control: public, s-maxage=..., stale-while-revalidate=...`
- `Vercel-CDN-Cache-Control: public, s-maxage=..., stale-while-revalidate=...`

Private paths now receive:

- `Cache-Control: private, no-store, max-age=0, must-revalidate`
- `CDN-Cache-Control: no-store`
- `Vercel-CDN-Cache-Control: no-store`

Private coverage includes account, admin, cart, checkout, order confirmation, vendor, auth, mobile auth/customer/vendor/delivery, orders, payments, support, upload, wishlist, and notifications paths.

Automated guardrail:

- `npm test` checks public CDN headers, private no-store headers, and private path classification.

Production verification:

```bash
curl -I https://www.fit-bazar.com/api/products
curl -I https://www.fit-bazar.com/api/search?q=shirt
curl -I https://www.fit-bazar.com/api/vendors
curl -I https://www.fit-bazar.com/account/dashboard
curl -I https://www.fit-bazar.com/api/payments/config
```

Expected:

- Public APIs show the public cache headers.
- Private/auth/payment/account routes show no-store headers.
- Vercel responses should be reviewed with `x-vercel-cache` for `HIT`, `MISS`, or `STALE`. A healthy public campaign should trend toward high `HIT` after warm-up.

## 3. Database Verification Audit

Added migration:

- `prisma/migrations/20260620120000_public_search_scale_indexes/migration.sql`

Indexes/extensions:

- `CREATE EXTENSION IF NOT EXISTS pg_trgm`
- Product trigram indexes for public `name`, `description`, and `category` search.
- Product GIN indexes for `tags`, `sizes`, and `colors`.
- Product partial btree indexes for public price and vendor-store sort paths.
- Vendor trigram indexes for public `shopName` and `category` search.

Verification tool:

```bash
CONFIRM_EXPLAIN_ANALYZE=YES npm run db:explain:public
```

Safety:

- The EXPLAIN script does nothing unless `CONFIRM_EXPLAIN_ANALYZE=YES`.
- It redacts connection strings in output.
- Default connection uses `DATABASE_URL` so the read path matches runtime pooling. Use `DIRECT_URL` only for migrations/admin operations.

What to inspect:

- `pg_trgm installed: yes`.
- Expected scale indexes are present.
- Search plans should use trigram/GIN indexes when selectivity is useful.
- Public product listing should use visibility/sort indexes and avoid sequential scans at production catalog size.

## 4. Checkout And Concurrency Safety Audit

Inventory:

- Checkout still validates product availability during preparation.
- The transaction now decrements stock with a conditional `updateMany` requiring `stock >= quantity` and public product visibility.
- If a parallel checkout consumes the stock first, the later transaction fails with `INSUFFICIENT_STOCK` and rolls back.

Coupons:

- Coupon use is now claimed inside the transaction through conditional SQL:
  - active coupon only
  - `usedCount < maxUses`
  - not expired
- Failed claims roll back the order transaction.

Orders and idempotency:

- COD order creation uses `IdempotencyKey`.
- Payment initiation uses `IdempotencyKey`.
- Online payment confirmation uses `PaymentAttempt` claim states and `checkoutGroupId` to prevent duplicate order creation after retries.

Price and stock revalidation:

- Prices and stock are re-read from the database before checkout context is built.
- Stock is enforced again at write time.
- Orders store the final product price used for that checkout.

Known remaining gaps:

- Cart mutation validates stock at add/update time, but cart is not a reservation system. Checkout remains the source of truth.
- Provider webhook dedupe table is not implemented because current online flow is callback/confirm based. If provider webhooks are added, store unique provider event IDs.
- Cancellation/refund/restock automation is not complete. Manual admin cancellation must not assume stock restoration until this workflow is implemented.
- SKU-level variant inventory is not present; current inventory is product-level.

## 5. Load Testing Suite

Added:

- `tests/k6/fitbazar-100k.js`
- `tests/k6/README.md`
- `npm run load:k6`

Profiles:

- `smoke`
- `1000`
- `5000`
- `10000`
- `25000`
- `50000`
- `100000`

Guards:

- `TARGET_URL` is required.
- Non-smoke profiles require `CONFIRM_DISTRIBUTED_LOAD_TEST=YES`.
- 50k and 100k profiles require `K6_DISTRIBUTED_RUN=YES`.
- Large tests must run from distributed runners or k6 Cloud, not one laptop.

Smoke example:

```bash
TARGET_URL=https://staging.fit-bazar.com K6_PROFILE=smoke npm run load:k6
```

Staged example:

```bash
TARGET_URL=https://staging.fit-bazar.com \
K6_PROFILE=1000 \
CONFIRM_DISTRIBUTED_LOAD_TEST=YES \
npm run load:k6
```

## 6. Reliability Controls

Implemented in code now:

- Public Redis cache fail-open behavior.
- Redis timeout controls.
- Cache stampede protection.
- Private no-store headers.
- Request correlation response header `X-Request-Id`.
- Health endpoint: `/api/health`.
- Readiness endpoint: `/api/readiness`.
- Redacting structured logger for secrets, tokens, auth headers, and database URLs.
- Checkout idempotency and conditional stock/coupon writes.

Still required before 100k go-live:

- Redis-backed distributed rate limiting.
- WAF/bot protection at Vercel/Cloudflare.
- Queue-backed email, push, analytics, and image side effects.
- Circuit breakers for payment providers and Cloudinary.
- Sentry server tracing and mobile release tracking.
- Spend alerts for Vercel, Neon, Upstash, Cloudinary, Sentry, Firebase, and k6.
- Feature flags for Redis cache, mobile checkout, online payment providers, and high-risk campaign features.
- Rollback-tested database migration process.

## 7. Environment Checklist

Runtime:

- `DATABASE_URL`: Neon pooled runtime connection.
- `DIRECT_URL`: direct migration/admin connection.
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_SITE_URL`

Redis:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `FITBAZAR_CACHE_PREFIX`
- `FITBAZAR_REDIS_TIMEOUT_MS`
- `FITBAZAR_REDIS_CACHE_DISABLED`

Observability:

- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`
- Firebase project variables for mobile analytics/push.

Media/payment/email:

- Cloudinary variables.
- Khalti/eSewa/connectIPS/Fonepay variables as each provider is actually enabled.
- Resend/email variables.

## 8. Staging Test Instructions

1. Restore production-like catalog size into staging without real customer secrets.
2. Deploy this branch to staging with Neon pooled `DATABASE_URL`.
3. Apply migrations using `DIRECT_URL`.
4. Enable Redis env vars in the hosting dashboard.
5. Warm public pages and APIs.
6. Run `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build:local`.
7. Run `CONFIRM_EXPLAIN_ANALYZE=YES npm run db:explain:public`.
8. Run k6 `smoke`, then `1000`, `5000`, `10000`, and only continue if gates pass.
9. Test checkout with staging-only test products and idempotency keys.
10. Capture report: p50/p95/p99, error rate, RPS, CDN hit ratio, Redis latency, Neon CPU/connections/slow queries, Vercel function duration/errors, duplicate order count.

## 9. Monitoring Checklist

- Vercel: function duration, invocation count, cold starts, error rate, bandwidth, `x-vercel-cache` trend.
- Neon: CPU, memory, connections, wait events, slow queries, deadlocks, lock time, storage I/O.
- Redis/Upstash: command count, p95 latency, errors/timeouts, rate limit/cost.
- Sentry: server errors, checkout/payment traces, mobile errors, release health.
- Cloudinary: transformations, bandwidth, errors, quota.
- Payments: initiation failures, confirmation failures, callback latency, duplicate/cancelled attempts.
- Business: orders/minute, failed checkout rate, stock mismatch rate, coupon exhaustion behavior.

## 10. Rollback

- Code rollback: redeploy previous Vercel deployment.
- Cache rollback: set `FITBAZAR_REDIS_CACHE_DISABLED=true`.
- CDN rollback: reduce public cache TTLs or purge Vercel cache.
- Migration rollback: do not drop indexes during an incident. Disable the code path first, then schedule a low-traffic migration if an index must be removed.
- Checkout incident: temporarily disable online payment methods or mobile checkout through feature flags/provider config; keep COD only if order writes remain healthy.
- Load-test rollback: abort k6/JMeter, block load-generator IPs if needed, and scale down staging resources after metrics are collected.

## 11. Go/No-Go Scorecard

Go requires all:

- Distributed staging profile at the target tier passes for 30+ minutes.
- Public browse p95 under 500 ms and p99 under 1500 ms.
- Search p95 under 300 ms or a documented fallback/search-service plan is active.
- Product detail p95 under 1 second.
- Checkout p95 under 2 seconds.
- Error rate under 1%.
- No duplicate orders under retry/idempotency tests.
- No oversold product in concurrent checkout tests.
- CDN hit ratio meets the traffic model.
- Neon CPU, connections, and slow-query rate stay within plan limits.
- Rollback is tested.

No-go if any:

- Database connection exhaustion.
- Public cache hit ratio below target after warm-up.
- Duplicate orders, oversell, or coupon overuse.
- Payment confirmation race or unrecoverable failed-payment state.
- Unredacted secrets appear in logs.
- Cost projections exceed approved budget.

Current score: architecture foundation improved, but no-go for claiming 100k readiness until staged distributed results are captured.
