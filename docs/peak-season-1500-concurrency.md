# Peak Season 1500 Concurrency Runbook

## Target

FitBazar should handle 1500 concurrent public shoppers during Dashain/Tihar browsing peaks when CDN caching is warm and production infrastructure is healthy.

This target is for public browsing traffic:

- Home
- Products listing
- Product detail
- Collections
- Search API
- Vendor/store pages
- Public catalog APIs

Checkout, payment confirmation, account, admin, and vendor dashboards must be tested separately because those paths intentionally bypass public cache.

## Required Production Settings

- Deploy on Vercel or equivalent CDN-backed hosting.
- Keep public HTML/API cache headers enabled.
- Use Neon pooled `DATABASE_URL` for runtime traffic.
- Keep `DIRECT_URL` only for migrations/admin scripts.
- Set `NEXT_PUBLIC_ANALYTICS_SAMPLE_RATE=0.05` during peak campaigns.
- Keep `SEARCH_LOG_SAMPLE_RATE=0.01` to `0.02` during peak campaigns.
- Keep product images on Cloudinary or another image CDN.
- Run `npm run build` in deployment so `prisma migrate deploy` applies indexes.

## Warm Cache Before Campaign

Hit key public pages before sending real traffic:

```bash
curl -s -o /dev/null https://www.fit-bazar.com/
curl -s -o /dev/null https://www.fit-bazar.com/products
curl -s -o /dev/null https://www.fit-bazar.com/products/saree
curl -s -o /dev/null https://www.fit-bazar.com/collections/mens-fashion-nepal
curl -s -o /dev/null 'https://www.fit-bazar.com/api/products?limit=12'
curl -s -o /dev/null https://www.fit-bazar.com/api/vendors
curl -s -o /dev/null 'https://www.fit-bazar.com/api/search?q=saree'
```

Expected public responses should include `s-maxage` or CDN cache status headers.

## 1500 Concurrency CDN Gate

Use this first to validate edge/CDN capacity without forcing a single laptop to download huge HTML bodies:

```bash
LOAD_TEST_BASE_URL=https://www.fit-bazar.com \
LOAD_TEST_CONCURRENCY=1500 \
LOAD_TEST_DURATION_SECONDS=180 \
LOAD_TEST_TIMEOUT_MS=15000 \
LOAD_TEST_METHOD=GET \
LOAD_TEST_READ_BODY=false \
LOAD_TEST_PATHS='/,/products,/products/saree,/collections/mens-fashion-nepal,/api/products?limit=12,/api/search?q=saree,/api/vendors,/api/categories,/api/site-settings' \
npm run load:test
```

Pass gate:

- Error rate under `0.5%`
- p95 under `1500ms`
- No sustained 5xx responses
- CDN cache hit rate high for public HTML/assets/API

## Browser-Like Body Download Gate

Run a lower but realistic full-body test from a machine with strong network and high open-file limits:

```bash
ulimit -n 10000
LOAD_TEST_BASE_URL=https://www.fit-bazar.com \
LOAD_TEST_CONCURRENCY=300 \
LOAD_TEST_DURATION_SECONDS=180 \
LOAD_TEST_TIMEOUT_MS=15000 \
LOAD_TEST_PATHS='/,/products,/products/saree,/collections/mens-fashion-nepal,/api/products?limit=12,/api/search?q=saree,/api/vendors,/api/categories,/api/site-settings' \
npm run load:test
```

Pass gate:

- Error rate under `1%`
- p95 under `1500ms`
- No app 5xx bursts

## Checkout Gate

Run separately with smaller concurrency because it writes orders/payments:

```bash
LOAD_TEST_BASE_URL=https://www.fit-bazar.com \
LOAD_TEST_CONCURRENCY=50 \
LOAD_TEST_DURATION_SECONDS=120 \
LOAD_TEST_PATHS='/cart,/checkout,/api/payments/config' \
npm run load:test
```

Never stress real payment initiation against production without a controlled test payment environment.

## Watch During Test

- Vercel function errors and duration
- CDN cache hit rate
- Neon CPU, active connections, slow queries
- Payment provider latency
- Resend/email error rate
- 5xx rate by route

## Rollback Trigger

Rollback or pause campaign traffic if any of these happen for more than 3 minutes:

- 5xx rate above `1%`
- Checkout/order creation errors above `0.5%`
- Database connection saturation
- p95 public page latency above `2500ms`
- Payment callbacks delayed or failing
