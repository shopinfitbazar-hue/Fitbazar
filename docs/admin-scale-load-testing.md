# Admin Scale And Load Testing

## What Changed

- High-volume admin lists are now server-side paginated and searchable.
- Vendors, products, orders, customers, and support tickets return only one bounded page.
- Admin search supports partial matches for customer name/email/phone, vendor shop/owner/PAN, product name/category/vendor, order/customer/payment details, and support tickets.
- Database migrations add btree and trigram indexes for large datasets.
- The admin UI shows per-section search boxes, record totals, and next/previous pagination.

## Why This Matters

Do not load all customers, vendors, or products into the admin browser. At lakhs of records, that makes both the browser and database slow. Admin screens should always ask the backend for the exact page and search query needed.

## Load Smoke Test

Run against local or deployed Vercel:

```bash
npm run load:test
```

Public production example:

```bash
LOAD_TEST_BASE_URL=https://fit-bazar.com \
LOAD_TEST_CONCURRENCY=100 \
LOAD_TEST_DURATION_SECONDS=60 \
npm run load:test
```

Admin API example:

```bash
LOAD_TEST_BASE_URL=https://fit-bazar.com \
LOAD_TEST_COOKIE='next-auth.session-token=YOUR_ADMIN_COOKIE' \
LOAD_TEST_PATHS='/api/admin/vendors?page=1&pageSize=25,/api/admin/products?page=1&pageSize=25&q=shirt,/api/admin/orders?page=1&pageSize=25,/api/admin/customers?page=1&pageSize=25&q=krish,/api/admin/support?page=1&pageSize=25' \
LOAD_TEST_CONCURRENCY=50 \
LOAD_TEST_DURATION_SECONDS=60 \
npm run load:test
```

## 100,000 Concurrent Users

A single laptop or single Vercel region smoke test cannot honestly prove 100,000 concurrent users. For that target:

- Use staged load tests from distributed regions.
- Test public browsing, search, product detail, cart, checkout, auth, admin analytics, admin search, vendor orders, and upload flows separately.
- Watch Vercel function duration/errors, Neon CPU/connections/slow queries, CDN cache hit rate, and payment callback latency.
- Run the largest tests on a staging database copy, not directly on production.
- Add queue-backed work for email, image processing, notifications, and heavy analytics exports before major traffic campaigns.

## Practical Release Gate

- `npm run build:local`
- `npm test`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run load:test` against staging
- Confirm Vercel build uses `npm run build` so `prisma migrate deploy` applies indexes and tables.
