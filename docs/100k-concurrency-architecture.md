# FitBazar 100k Concurrent Customer Architecture

Date: 2026-06-20

Goal: support 100,000 concurrent customer sessions without creating duplicate databases, duplicate product systems, duplicate auth, or duplicate order flows.

This is not one server setting. It requires CDN offload, shared cache, pooled database connections, indexed search, queues, observability, and staged load tests.

Current proof status: no-go for claiming 100k readiness until distributed staging tests pass. See `docs/100k-phase-2-audit.md` for the current implementation audit, risks, and go/no-go scorecard.

## Architecture Rule

FitBazar keeps:

- One source-of-truth PostgreSQL database.
- One existing backend and admin panel.
- One product/vendor/order/inventory model.
- Three mobile apps and the website sharing the same API contract.

FitBazar may add:

- CDN/cache layers.
- Redis for shared cache, rate limits, idempotency, and queue coordination.
- A dedicated search index later if Postgres search p95 cannot meet target.
- Read replicas/materialized views for analytics, not separate business truth.

## 100k Traffic Shape

100k concurrent customers should be interpreted as:

- Most users browsing cached pages/products.
- A smaller active subset searching/filtering.
- A much smaller subset carting/checking out at the same moment.
- Admin/vendor/delivery traffic isolated from public browse load.

Target split for load tests:

- 85-90% public cached browse/product/category/vendor reads.
- 5-10% search/filter requests.
- 3-5% authenticated customer reads/writes.
- 0.5-1% checkout/payment writes.

## Code Foundations Added

- Public catalog/search/vendor cache now has optional Redis REST backing via `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
- Redis cache keys are versioned through `revalidateStorefrontCache()` invalidation and include stampede protection.
- Public API cache headers now include `Cache-Control`, `CDN-Cache-Control`, and `Vercel-CDN-Cache-Control`.
- Private account/auth/cart/checkout/admin/vendor/mobile/payment routes now emit explicit no-store cache headers.
- Checkout stock and coupon writes now use conditional database updates inside the transaction.
- Search/product/vendor public indexes were added through the `20260620120000_public_search_scale_indexes` migration.
- k6 staged profiles exist in `tests/k6/fitbazar-100k.js`; large profiles are guarded by confirmation variables.
- Load smoke runner now supports expected statuses, ramp-up, think time, and jitter.
- Mobile apps still use the same backend and database.

References used:

- Vercel documents `CDN-Cache-Control` and `Vercel-CDN-Cache-Control` for CDN cache behavior: https://vercel.com/docs/caching/cache-control-headers
- Upstash documents sending full Redis commands as a JSON array in the REST request body: https://upstash.com/docs/redis/features/restapi
- Neon recommends pooled connection strings for serverless/concurrent web application traffic: https://neon.com/docs/connect/connection-pooling

## Required Items From You

To actually operate at 100k concurrent customers, provide:

1. Production Neon plan details:
   - Current compute size.
   - Pooled `DATABASE_URL`.
   - Direct `DIRECT_URL` for migrations.
   - Maximum connection limits.
   - Read replica availability if needed.

2. Redis/Upstash:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - Region near the app/serverless region.

3. CDN and hosting:
   - Vercel project/team capacity or equivalent hosting plan.
   - WAF/bot protection decision.
   - Image optimization quota and Cloudinary plan.

4. Search decision:
   - Start with Postgres trigram indexes.
   - Move to Typesense, Meilisearch, Algolia, or OpenSearch if real p95 search remains above 300 ms.

5. Observability:
   - Sentry DSN for web and all mobile apps.
   - Neon metrics access.
   - Vercel analytics/observability access.
   - Load-test dashboard owner.

6. Load-test environment:
   - Production-sized staging database.
   - Seeded catalog at realistic size.
   - Separate JMeter/k6 load generator machines.
   - Test customer/vendor/delivery accounts.

## Current No-Go Items

- Redis-backed distributed rate limiting is not implemented yet.
- Queue-backed email/push/analytics side effects are not implemented yet.
- Cancellation/refund/restock automation is not complete.
- Provider webhook dedupe must be added if payment webhooks are enabled.
- 100k capacity has not been proven by distributed staging load tests.

## Rollout Plan

### Stage 1: 1k Concurrent

- Enable pooled `DATABASE_URL`.
- Enable Redis cache env vars.
- Deploy current code.
- Run public browse/search smoke at 1k concurrent.
- Fix slow query plans.

### Stage 2: 10k Concurrent

- Require CDN hit ratio above 90% for public browse pages.
- Confirm product/search/vendor APIs have p95 under target.
- Add Redis-backed distributed rate limiting.
- Move notification/email fanout to background jobs.

### Stage 3: 50k Concurrent

- Add dedicated search service if Postgres search is the bottleneck.
- Use read replicas/materialized views for analytics/admin dashboards.
- Add queue workers for side effects.
- Confirm checkout idempotency under retry storms.

### Stage 4: 100k Concurrent

- Public cached browse p95 under 500 ms.
- Product page p95 under 1 second.
- Search p95 under 300 ms with search service if needed.
- Checkout p95 under 2 seconds.
- Error rate under 1%.
- No duplicate orders under retry.
- Database CPU and connections stable for 30+ minutes.

## Non-Negotiables

- Do not send all public browsing traffic to Postgres.
- Do not run 100k load tests against production before staging proves safe.
- Do not count bot traffic as customer concurrency.
- Do not run migrations that create heavy indexes during peak traffic.
- Do not add a second order/product/vendor database.

## Commands

Public API smoke:

```bash
LOAD_TEST_BASE_URL=https://www.fit-bazar.com \
LOAD_TEST_CONCURRENCY=100 \
LOAD_TEST_RAMP_SECONDS=30 \
LOAD_TEST_DURATION_SECONDS=120 \
LOAD_TEST_READ_BODY=false \
LOAD_TEST_PATHS='/,/products,/api/products,/api/search?q=shirt,/api/vendors' \
npm run load:test
```

Expected-auth smoke example:

```bash
LOAD_TEST_BASE_URL=https://www.fit-bazar.com \
LOAD_TEST_EXPECTED_STATUSES='200-399,401' \
LOAD_TEST_PATHS='/api/mobile/v1/auth/me' \
npm run load:test
```
