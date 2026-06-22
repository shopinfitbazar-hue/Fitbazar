# FitBazar Load Testing And Scalability Plan

Date: 2026-06-15

## Current Bottleneck Report

Observed risk areas from the repository:

- Public catalog pages and APIs were previously too database-dependent under load. The current code now uses cached catalog helpers, but JMeter must verify that product listing, product detail, vendor listing, and collection pages are served from cache/CDN whenever possible.
- Search still depends on PostgreSQL `contains` filters. This is acceptable for launch if indexed and paginated, but it is the most likely endpoint to miss the 300 ms target once traffic grows.
- Authenticated cart, order, vendor, and delivery endpoints use live database reads/writes. These must be paginated, idempotent where writes can be retried, and protected by rate limits.
- Neon connection pressure is a likely failure mode under high concurrency if every request opens work at once. The app now uses the Neon adapter, but load tests should track database connection count, query latency, and timeout rate.
- Images can dominate full-body page tests if product images are unoptimized. Cloudinary/CDN image transformation should be mandatory before 3000-concurrency launch tests.
- In-memory middleware rate limiting is useful for one instance but not sufficient for multi-instance production. Upstash Redis or another shared limiter should replace it before broad launch.

## Implemented Scalability Work

- Mobile apps share the existing backend, database, auth users, products, vendors, orders, inventory, notifications, and admin control plane.
- Mobile bearer-token auth was added for customer, vendor, and delivery apps.
- Checkout writes now support idempotency for retry-safe order creation.
- Hot vendor/customer order/product endpoints are paginated.
- Delivery assignment/status domain exists in the same database and is controlled by the admin panel.
- Public catalog APIs use cache headers and Next cache helpers.
- Middleware blocks sensitive paths, rate limits high-risk endpoints, and adds baseline security headers.
- Shared packages centralize API client, DTOs, and formatting utilities.

## Capacity Estimate

Current unoptimized capacity should be treated as staging-only until measured:

- Public cached browsing: likely hundreds to low thousands of concurrent users if CDN cache hit ratio is high.
- Search: likely the first endpoint to degrade; estimate 100-300 concurrent search-heavy users until query plans are measured.
- Authenticated checkout: capacity depends on Neon write latency and payment gateway behavior; assume 50-150 concurrent checkouts until load-tested.

After the implemented foundations plus Redis rate limiting/cache, Cloudinary image optimization, query indexes, and CDN tuning:

- Public browsing: 3000+ concurrent users with high cache hit ratio.
- Search: 3000 users browsing with a smaller active search subset, or dedicated search service if p95 remains above 300 ms.
- Authenticated APIs: 500 ms p95 target for common reads.
- Checkout: 2 second p95 target with idempotency preventing duplicate orders.

## JMeter Test Plan

Run separate tests before mixed traffic. Always capture p50, p95, p99, error rate, RPS, DB CPU, DB connections, server memory, and slow queries.

### Public Browsing

- `/`
- `/products`
- `/api/products?page=1&limit=24`
- `/api/search?q=shirt&limit=24`
- `/api/vendors?page=1&limit=24`
- `/collections/mens-fashion-nepal`
- Product detail URLs from seeded production-like data.

Ramp:

- 50 users for 5 minutes
- 250 users for 10 minutes
- 1000 users for 15 minutes
- 3000 users for 20 minutes

Pass:

- Error rate under 1%
- Public cached p95 under 500 ms
- Product detail p95 under 1 second

### Authenticated Customer

- Mobile login
- Cart read
- Cart add
- Order list
- COD checkout with unique idempotency key

Ramp:

- 25 users for 5 minutes
- 100 users for 10 minutes
- 300 users for 15 minutes

Pass:

- No duplicate orders per idempotency key
- Checkout p95 under 2 seconds
- Error rate under 1%

### Vendor

- Mobile vendor login
- Dashboard
- Product list
- Product draft submission
- Order list

Pass:

- Dashboard p95 under 500 ms
- Product/order list p95 under 700 ms
- Product submission creates draft only and notifies admin.

### Delivery

- Delivery login
- Active assignments
- Status transition assigned to pickup confirmed
- Status transition pickup confirmed to in transit
- Status transition in transit to delivered

Pass:

- Status update p95 under 500 ms
- Invalid transitions rejected
- Customer/vendor notifications created.

## Local Smoke Commands

Use the existing Node smoke runner before JMeter:

```bash
LOAD_TEST_BASE_URL=http://127.0.0.1:3000 \
LOAD_TEST_CONCURRENCY=25 \
LOAD_TEST_DURATION_SECONDS=30 \
npm run load:test
```

Production read-only smoke:

```bash
LOAD_TEST_BASE_URL=https://www.fit-bazar.com \
LOAD_TEST_CONCURRENCY=100 \
LOAD_TEST_DURATION_SECONDS=60 \
LOAD_TEST_READ_BODY=false \
LOAD_TEST_PATHS='/,/products,/api/products,/api/search?q=shirt,/api/vendors' \
npm run load:test
```

## Latest Local Smoke Result

Latest smoke on the built Next server (`http://127.0.0.1:3007`) used public read paths only:

- Paths: `/`, `/products`, `/api/products`, `/api/search?q=shirt`, `/api/vendors`
- Concurrency: 5
- Duration: 8 seconds
- Requests: 860
- Failures: 0
- RPS: 107.26
- Latency p50/p95/p99: 19 ms / 72 ms / 408 ms

An earlier mixed run included unauthenticated `/api/mobile/v1/auth/me`; those requests correctly returned `401` and were counted as failures by the generic smoke runner. Authenticated mobile load testing should use real bearer tokens or separate expected-status assertions.

## Infrastructure For 3000 Concurrent Users

Recommended startup-friendly stack:

- Vercel Pro or equivalent with CDN cache enabled.
- Neon pooled PostgreSQL with enough compute for production reads/writes and slow query monitoring.
- Upstash Redis for shared rate limiting, idempotency acceleration, cache tags, and lightweight background queues.
- Cloudinary for product image transformation, format negotiation, and responsive delivery.
- Sentry for server/mobile error and performance tracing.
- Firebase/Expo notifications for push delivery.

For the newer 100k concurrent customer target, see `docs/100k-concurrency-architecture.md`, `docs/100k-phase-2-audit.md`, and `docs/traffic-model.md`.

Avoid until required:

- Separate mobile backend
- Separate databases
- Kubernetes
- Kafka
- Microservice split

## Next Optimization Backlog

1. Add Redis-backed distributed rate limiting and idempotency read-through cache.
2. Add query plan tests for `/api/search`, `/api/products`, `/api/vendor/orders`, and `/api/mobile/v1/delivery/assignments`.
3. Add Cloudinary transformation enforcement for uploaded product images.
4. Add JMeter `.jmx` suites if needed; guarded k6 profiles now exist in `tests/k6/fitbazar-100k.js`.
5. Add Sentry performance traces around checkout, search, mobile auth, vendor dashboard, and delivery status transitions.
6. Add background jobs for notification fanout and admin/vendor email instead of doing all side effects inline.
