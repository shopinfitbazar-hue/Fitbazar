# Fit Bazzar Scaling Recommendations

## Implemented In App

- Storefront product listing and search now use cached server-side catalog/search queries for the first render.
- `/api/products` and `/api/search` reuse the same cached catalog/search layer and send CDN-friendly cache headers.
- Anonymous home, product listing, search, collection, and vendor storefront pages have ISR-style revalidation.
- Admin analytics lives under admin-only APIs and is kept separate from shopper-facing catalog APIs.
- Browser analytics now sends page views, page-load timing, and Core Web Vitals through `/api/analytics/track`.
- Admin vendors, products, orders, customers, and support lists are server-side searched and paginated.
- Load smoke testing is available through `npm run load:test`.

## Production Infrastructure Still Required

- Add Algolia, Meilisearch, Typesense, or another dedicated search index once database `contains` search is no longer enough.
- Move analytics writes to a CDN/edge collector or event pipeline if `/api/analytics/track` becomes hot during campaigns.
- Add queue-backed Cloudinary/image/video ingestion for vendor bulk uploads before allowing large CSV/bulk media imports.
- Add full `@sentry/nextjs` and React Native Sentry instrumentation when package installation and DSNs are available.
- Run distributed load tests against staging before major campaigns; a local machine cannot prove 100,000 concurrent users.

## Watch Metrics

- Vercel function duration, memory, invocation count, error rate, and bandwidth.
- Neon CPU, slow queries, active connections, storage, and pool pressure.
- CDN cache hit rate for catalog, collection, vendor, and search routes.
- Core Web Vitals: LCP, CLS, INP, FCP, TTFB.
- Checkout conversion, payment callback latency, and failed payment confirmations.
