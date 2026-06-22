# FitBazar Traffic Model

Date: 2026-06-20

This model converts "concurrent customers" into traffic assumptions. It is intentionally conservative because 100,000 logged-in or browsing customers does not mean 100,000 checkout writes per second.

FitBazar remains one backend, one Neon PostgreSQL database, one admin panel, one product/order/vendor system, and shared mobile/web APIs.

## Scenario A: Conservative Campaign

- Concurrent customers: 25,000
- Active customers in a given minute: 2,500-4,000
- Public browse/search mix: 90%
- Authenticated/cart/order mix: 9%
- Checkout/payment write mix: 1%
- Edge/CDN request rate: 300-800 requests/second
- Required CDN hit ratio for public pages/APIs: 90%+
- Expected origin request rate after CDN/cache: 60-160 requests/second
- Expected database writes: 3-8 writes/second

Use this for first large staging verification after 1k and 5k profiles pass.

## Scenario B: Expected 100k Event

- Concurrent customers: 100,000
- Active customers in a given minute: 8,000-12,000
- Public browse/search mix: 88-92%
- Authenticated/cart/order mix: 7-10%
- Checkout/payment write mix: 0.5-1.5%
- Edge/CDN request rate: 1,000-2,500 requests/second
- Required CDN hit ratio for public browse: 95%+
- Required Redis/Next cache hit ratio for public APIs: 85%+
- Expected origin request rate after CDN/cache: 150-400 requests/second
- Expected database writes: 15-40 writes/second

This is the target model for 100k readiness, but it is not proven until distributed k6/JMeter tests pass against production-sized staging data.

## Scenario C: Extreme Flash Sale

- Concurrent customers: 100,000+
- Active customers in a given minute: 20,000-30,000
- Public browse/search mix: 80-85%
- Authenticated/cart/order mix: 12-18%
- Checkout/payment write mix: 2-4%
- Edge/CDN request rate: 3,000-7,000 requests/second
- Required CDN hit ratio for public browse: 97%+
- Expected origin request rate after CDN/cache: 300-900 requests/second
- Expected database writes: 60-200 writes/second

This requires a higher Neon compute tier, strict bot protection, warmed CDN/cache, background jobs, and likely a dedicated search service. It is not a first release target.

## Traffic Split For Load Tests

- 85% public browse: home, products, product detail, vendor detail, categories, site settings.
- 8% search/filter: search endpoint and filtered product listing.
- 5% authenticated customer reads: mobile auth/me, cart, wishlist, orders.
- 1% cart mutation: add/update/remove cart items.
- 1% checkout/payment: COD staging checkout and payment callback simulations with idempotency.

## Capacity Interpretation

Go/no-go must use measured p95/p99, error rate, database CPU, database connection count, CDN hit ratio, Redis latency, and duplicate-order checks. A single local test, or a CDN-only test without checkout, cannot prove full 100k readiness.
