# FitBazar Architecture Audit And Implementation Plan

Date: 2026-06-15

## Executive Summary

FitBazar is currently a single Next.js 14 application at the repository root. It already contains the website, admin panel, vendor panel, backend API routes, Prisma schema, Neon/PostgreSQL integration, NextAuth authentication, product/catalog logic, checkout/order creation, coupons, payments, Cloudinary upload signing, notifications, support, analytics, and load smoke tooling.

The correct architecture is to keep this application as the source of truth and add mobile apps around it. Do not create a second backend, database, auth store, order service, product service, vendor service, or admin panel.

The main architectural gaps for the requested ecosystem are:

- No Expo React Native apps exist yet.
- No `/api/mobile/v1/*` contract layer exists yet.
- NextAuth works well for web, but mobile needs a secure token/session bridge using the same `User`, `Vendor`, and role rules.
- Delivery partner is not a first-class domain yet. Orders have delivery statuses, but there is no delivery partner model, assignment table, route workflow, proof-of-delivery, or delivery earnings model.
- Public catalog caching and admin pagination already exist, but some authenticated vendor/customer endpoints remain unpaginated or aggregate too much data.
- Rate limiting is currently in-memory per runtime instance, which is not enough for horizontally scaled production.
- Search still uses Postgres `contains` queries. That is acceptable early, but dedicated search will be needed as SKU count and traffic grow.
- Analytics writes are sampled on the website, but there is no queue/event pipeline, Firebase Analytics, Expo push token storage, or Sentry package instrumentation yet.

Verification baseline:

- `npm test` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed.

Implementation progress on 2026-06-15:

- Added npm workspace support for future `apps/*` and `packages/*`.
- Added `packages/shared-types`, `packages/shared-utils`, and `packages/shared-api`.
- Added mobile token session and device token schema foundations.
- Added `/api/mobile/v1/auth/login`, `/refresh`, `/logout`, `/me`, and `/api/mobile/v1/devices`.
- Verified with tests, typecheck, lint, and `npm run build:local`.

## Current Repository Structure

Current shape:

```text
fit-bazar/
├── src/app                 # Next.js App Router pages and API routes
├── src/app/admin           # Existing admin panel
├── src/app/vendor          # Existing vendor panel
├── src/app/api             # Existing backend API routes
├── src/components          # Website/admin/vendor UI components
├── src/lib                 # Business logic and server helpers
├── prisma                  # Prisma schema, migrations, seed
├── docs                    # Existing scaling/deployment/mobile notes
├── scripts                 # Load smoke runner
├── tests                   # Launch guardrail tests
├── pages                   # Legacy health/error pages
└── public                  # Static assets
```

Recommended monorepo target:

```text
fit-bazar/
├── src/                    # Existing website/admin app remains here initially
├── apps/
│   ├── customer/           # Expo customer app
│   ├── vendor/             # Expo vendor app
│   └── delivery/           # Expo internal delivery app
├── packages/
│   ├── shared-api/         # Typed API clients for web/mobile
│   ├── shared-types/       # Shared DTOs and enums
│   └── shared-utils/       # Currency, validation, formatting, app constants
├── prisma/
└── docs/
```

Do not move the existing Next.js app into a `website/` folder during the first mobile phase unless deployment is prepared for that. A path move would be high-churn and could disrupt Vercel, NextAuth callback URLs, imports, and SEO. Add `apps/*` and `packages/*` first; move the website later only if the deployment model requires it.

## Existing Architecture Audit

### Website And Admin

- The website and admin are implemented in the same Next.js app.
- Admin remains the central control room under `src/app/admin`.
- Vendor portal exists under `src/app/vendor`.
- Public SEO routes include products, collections, shop pages, blog pages, sitemap, metadata, canonical URLs, and JSON-LD helpers.

Assessment: Keep this architecture. It is simpler and more affordable than introducing microservices or a separate admin app.

### Backend APIs

Existing API groups:

- Public catalog: `/api/products`, `/api/products/[slug]`, `/api/search`, `/api/vendors`, `/api/vendors/[slug]`, `/api/categories`, `/api/site-settings`
- Auth: `/api/auth/[...nextauth]`, `/api/auth/register`, forgot/reset/verify email
- Customer: cart, wishlist, orders, addresses, notifications, reviews, support
- Vendor: products, orders, status updates, payouts, settings, stats, reviews, partner program
- Admin: products, vendors, customers, orders, support, coupons, banners, settings, analytics, notifications
- Payments: initiate, confirm, config
- Upload: Cloudinary signed upload policy

Assessment: Mobile apps should call a versioned API facade that reuses these existing route handlers and `src/lib` business logic. Do not duplicate checkout or vendor product logic in the apps.

### Authentication

Current state:

- NextAuth v4 with JWT sessions.
- Credentials provider with bcrypt password verification.
- Optional Google provider.
- Session token includes user id, role, and vendor id.
- Server helpers enforce customer, vendor, and admin access.
- Middleware protects admin/vendor/account/API routes.

Mobile requirement:

- Add mobile-safe token sessions without replacing NextAuth.
- Store access/refresh tokens in Expo Secure Store.
- Keep user identity in the existing `User` table.
- Keep vendor identity in the existing `Vendor` table.
- Add token/device tables rather than a second auth system.

Recommended additions:

- `MobileSession` or `RefreshToken` model with hashed refresh tokens, device id, role, expiry, revocation, and last-used metadata.
- `DeviceToken` model for Expo/Firebase push tokens by user/app/device.
- `/api/mobile/v1/auth/login`, `/refresh`, `/logout`, `/me`, `/social/google`.
- Server-side role checks should reuse `requireCustomerSession`, `requireVendorSession`, and a new mobile bearer-token equivalent.

### Database

Existing Prisma domains:

- `User`, `Account`, `Session`, `VerificationToken`
- `Vendor`
- `Category`, `Product`
- `Order`, `OrderItem`
- `Review`, `VendorReview`
- `Wishlist`, `CartItem`, `Address`
- `Banner`, `Coupon`, `FestivalConfig`, `SiteSettings`
- `Notification`, `SupportTicket`, `SupportMessage`
- `PaymentAttempt`
- `AnalyticsEvent`, `PerformanceMetric`

Existing useful indexes:

- Product visibility/category/sort indexes.
- Vendor approval/partner/top shop indexes.
- Notification indexes.
- Admin-scale btree and trigram indexes.
- Analytics/performance indexes.

Database gaps:

- No first-class delivery partner, delivery assignment, route, proof, or earnings tables.
- No mobile refresh-token or push-device-token tables.
- No audit log table for admin/vendor/security-critical actions.
- No idempotency-key model for mobile checkout retries.
- Some authenticated endpoints need pagination-specific indexes.

Recommended additions:

- `DeliveryPartner`, `DeliveryAssignment`, `DeliveryStatusEvent`, `DeliveryEarning`.
- `MobileSession`, `DeviceToken`.
- `AuditLog`.
- `IdempotencyKey` for checkout/payment/order mutation safety.
- Additional indexes on `Order(vendorId, createdAt)`, `Order(vendorId, status, createdAt)`, `Order(customerId, createdAt)`, and delivery assignment status/date fields.

### Products And Vendors

Current strengths:

- Product status workflow exists: draft, active, hidden, out of stock.
- Vendor approval/suspension exists.
- Vendor product upload requires description and images.
- Product and vendor visibility filters are centralized.
- Storefront cache invalidation exists after product/order/admin changes.

Gaps:

- Vendor product and order APIs are not paginated yet.
- Vendor payouts load all qualifying orders.
- Inventory is only product-level stock; no SKU-level variant inventory table exists.
- Bulk upload/image ingestion is not queue-backed.

### Orders And Checkout

Current strengths:

- Checkout is centralized in `src/lib/checkout-server.ts`.
- Orders are grouped by vendor.
- Stock and coupon validation happen inside a transaction.
- COD creates orders directly.
- eSewa and Khalti create orders only after provider verification.
- Payment attempts use opaque hashed tokens and expiry.
- Notifications and email hooks exist.

Gaps:

- No delivery assignment workflow after `HANDED_TO_DELIVERY`.
- No delivery proof, delivery partner app state, or customer live tracking.
- No idempotency key for repeated mobile submit/network retry.
- Email and notification work happens inline after order creation instead of through a queue.

### Payments

Current state:

- COD, eSewa, Khalti, and Khalti local cards are supported/configured.
- connectIPS and Fonepay placeholders exist but are not wired.
- Server-side verification exists for eSewa and Khalti.

Plan:

- Keep current payment core.
- Add mobile deep-link return handling for online payments.
- Add idempotent payment confirmation.
- Wire connectIPS/Fonepay only when official merchant credentials and test callbacks are available.

### Security

Current strengths:

- Password hashing with bcrypt.
- NextAuth JWT sessions.
- Role-gated middleware and server helpers.
- Basic input clamping in catalog/search routes.
- Cloudinary upload signature route requires vendor/admin.
- Security headers are configured in `next.config.mjs`.
- Middleware blocks sensitive path probes.
- Basic in-memory rate limiting exists.
- Prisma parameterization is used for normal queries; raw queries are template-tagged.

Gaps:

- No shared schema validator such as Zod yet.
- Rate limiting is process-local and not shared across Vercel/runtime instances.
- CSP is minimal and should be tightened with script/img/connect directives after inventorying real providers.
- No audit logging table.
- No malware/type/size validation record for uploaded media beyond Cloudinary signing.
- No mobile token revocation/device management.

Recommended security work:

- Add Zod request schemas for all mutation routes.
- Move rate limiting to Redis/Upstash or another shared store.
- Add audit logs for admin/vendor order, product, payout, auth, and settings actions.
- Add idempotency keys for checkout/payment mutation routes.
- Add stricter Cloudinary upload constraints and moderation workflow.
- Add CSRF review for cookie-authenticated write routes. NextAuth helps auth, but same-site write routes should still be reviewed.

### Performance And Scalability

Existing strengths:

- Public catalog/search/vendor APIs use cache headers and `unstable_cache`.
- Home, product detail, collections, and vendor storefronts use cached server data.
- Admin high-volume lists are paginated.
- Search log writes are sampled.
- Website analytics is sampled client-side.
- Load smoke runner exists.

Bottlenecks likely causing JMeter struggles:

- JMeter may be hitting uncached dynamic pages/APIs instead of warm CDN paths.
- Authenticated cart/order/vendor/admin paths bypass public cache and hit the database.
- Local or single-region load tests can bottleneck the client machine, network, open file limits, or one Next process.
- Postgres `contains` catalog search becomes expensive as SKU count grows.
- Vendor products/orders/payout APIs are unpaginated.
- Admin stats loads every order row for chart data.
- Analytics writes go directly to Postgres.
- Email/notification/cache invalidation work is inline with some user flows.
- In-memory rate limiting is not shared and can create inconsistent behavior under horizontal scaling.
- Database connection pressure can rise quickly if Neon pooled runtime settings are not correct.

Current capacity estimate:

- Public browsing with warm CDN cache: the existing docs target about 1500 concurrent public shoppers, but this must be proven on staging/production with CDN and Neon metrics.
- Authenticated dynamic flows: likely much lower than public browsing until pagination, shared rate limiting, queueing, and DB hot paths are improved.
- 3000 concurrent active users across website and apps is achievable with this codebase, but not by simply adding apps. It needs the optimization plan below.

Target architecture for 3000 concurrent users:

- Vercel or equivalent CDN-backed hosting for Next.js.
- Neon pooled `DATABASE_URL` for runtime, direct URL only for migrations.
- Redis/Upstash for shared rate limiting, short-lived caches, idempotency locks, and job coordination.
- Dedicated search service when product count/search traffic outgrows Postgres contains queries.
- Cloudinary for product/banner media with responsive transformations.
- Queue-backed email, push notifications, analytics fanout, and image ingestion.
- Sentry for web and all React Native apps.
- Firebase Analytics plus app-owned analytics endpoint.

## Mobile Readiness Audit

Customer app can reuse:

- Public catalog/search/vendor/category/product APIs.
- Cart, wishlist, checkout, orders, addresses, reviews, notifications, support.
- Existing payment config/initiate/confirm flow with mobile callback/deep link additions.

Vendor app can reuse:

- Vendor auth/role model.
- Product upload route and vendor product APIs.
- Vendor order APIs and status transition rules.
- Vendor stats, payouts, settings, partner status, reviews.

Delivery app requires new backend:

- Delivery partner login role/model.
- Assignment queue.
- Pickup, in-transit, delivered, failed delivery, reschedule statuses.
- Customer contact masking/policy.
- Map route metadata.
- Proof of delivery.
- Earnings calculation.

Design direction from attached mobile reference:

- Premium white surface, deep navy primary actions, restrained gold accents, compact marketplace cards.
- Bottom tab navigation for customer/vendor/delivery.
- Mobile-first shopping flows, not a marketing landing screen.
- Preserve FitBazar logo, premium fashion positioning, and Nepal-focused copy.

## Implementation Plan

### Phase 1: Hardening And Contracts

Deliverables:

- Add `packages/shared-types`, `packages/shared-utils`, `packages/shared-api`.
- Add request/response DTOs for catalog, auth, cart, checkout, orders, vendor products, vendor orders, notifications, support.
- Add Zod or equivalent validation for high-risk mutation routes.
- Add pagination to vendor products, vendor orders, vendor payouts, customer orders, wishlist, and support lists.
- Add idempotency support to checkout/payment confirmation.
- Add audit logging.
- Add mobile auth/token models and API routes.

### Phase 2: Scalability Foundation

Deliverables:

- Add shared Redis-backed rate limiting.
- Add query/index migrations for authenticated hot paths.
- Replace admin stats all-row chart query with grouped SQL.
- Add queue abstraction for email, push, analytics, and image jobs.
- Add Sentry web instrumentation.
- Add staging load-test profiles for public, auth, checkout, vendor, admin, and mobile APIs.

### Phase 3: Customer Mobile App

Stack:

- Expo React Native, TypeScript, Expo Router, React Query, Zustand, Expo Secure Store.

MVP:

- Login/signup/social login.
- Home, search, categories, listings, PDP.
- Wishlist, cart, checkout, order tracking.
- Notifications, reviews, coupons, profile, support.
- Recently viewed and recommended products.
- Firebase Analytics and Sentry.

### Phase 4: Vendor Mobile App

MVP:

- Vendor login.
- Dashboard, product upload, product management, inventory.
- Orders and status updates.
- Sales analytics, earnings, promotions, support, reports.
- Push notifications for orders/admin decisions.

Backend prerequisite:

- Paginated vendor APIs and upload constraints must be complete before release.

### Phase 5: Delivery Partner App

MVP:

- Delivery login.
- Assigned deliveries.
- Pickup confirmation.
- In transit updates.
- Delivered/failed/rescheduled updates.
- Delivery history.
- Customer contact policy.
- Maps/route assistance.
- Earnings dashboard.

Backend prerequisite:

- Add delivery partner and assignment schema.
- Add admin delivery management.
- Add assignment/status APIs.
- Add customer order tracking events.

### Phase 6: Testing And Load Optimization

Test categories:

- Unit tests for shared utilities, checkout math, auth/token logic, delivery transitions.
- API integration tests for mobile auth, cart, checkout, vendor, delivery.
- E2E tests for website checkout and mobile critical paths.
- JMeter or k6 tests for public browsing, search, product detail, cart, checkout, vendor orders, delivery status updates, admin dashboards.

Load gates:

- Public cached browsing: 3000 concurrency, read-body off first, then lower full-body browser-like test.
- Search: p95 under 300 ms once dedicated search is added; before then, set realistic Postgres threshold.
- Authenticated API: p95 under 500 ms for common reads.
- Checkout: p95 under 2 seconds, zero duplicate orders under retry.
- Mobile launch: under 2 seconds to interactive on mid-range Android.

### Phase 7: Release Preparation

Android:

- EAS Build profiles.
- Package names for customer, vendor, delivery.
- Play Console assets, privacy, test accounts.
- Push notification credentials.

iOS:

- Bundle IDs for customer, vendor, delivery.
- Apple Sign-In decision if required by social login policy.
- App Store privacy labels.
- TestFlight rollout.

Operational:

- Production API URL only.
- Sentry release tracking.
- Firebase Analytics dashboards.
- Version-gated mobile API compatibility.
- Rollback plan for app versions and backend routes.

## Infrastructure Recommendation

Startup-friendly target:

- Vercel Pro or equivalent for web/API.
- Neon pooled Postgres with autoscaling appropriate to traffic.
- Upstash Redis for rate limiting, idempotency, and lightweight queues.
- Cloudinary for images.
- Firebase for push and analytics.
- Sentry for error/performance monitoring.
- Resend for email.

Avoid for now:

- Microservices.
- Separate mobile backend.
- Separate admin app.
- Separate product/order databases.
- Kafka or heavy event infrastructure.
- Premature Kubernetes.

## Implementation Progress

Completed in this implementation pass:

1. Added monorepo workspace support for `apps/*` and `packages/*`.
2. Added shared packages for API client, DTOs, and utility formatting.
3. Added mobile-safe bearer-token auth for customer, vendor, and delivery apps.
4. Added device token registration for Expo/FCM/APNS.
5. Added idempotency storage and retry-safe COD checkout/order creation.
6. Paginated customer/vendor hot endpoints and added order hot-path indexes.
7. Added delivery partner, assignment, status event, and earning schema.
8. Added admin delivery assignment API and mobile delivery status APIs.
9. Added mobile customer APIs for cart, orders, wishlist, and notifications.
10. Added mobile vendor APIs for dashboard, products, and orders.
11. Added customer, vendor, and delivery Expo apps using the same backend and shared client.
12. Added baseline mobile app screens for core customer, vendor, and delivery workflows.
13. Added middleware security headers and mobile endpoint rate-limit classes.
14. Added a dedicated load-testing and scalability plan in `docs/load-testing-and-scalability-plan.md`.
15. Added a 100k concurrent customer architecture plan in `docs/100k-concurrency-architecture.md`.
16. Added optional Redis REST cache support for public catalog/search/vendor APIs.
17. Added Postgres trigram/GIN search scaling indexes for public product/vendor search.
18. Added Phase 2 100k audit, traffic model, guarded k6 profiles, safe EXPLAIN tooling, private no-store headers, cache stampede protection, and conditional checkout stock/coupon writes.

Remaining before production release:

1. Apply Prisma migrations to staging/production and verify data backfills.
2. Add Firebase/Sentry runtime configuration to each Expo app.
3. Add Cloudinary upload flow for mobile vendor product images.
4. Add Redis-backed distributed rate limiting and queue-backed side effects.
5. Run JMeter/k6 staging tests and tune indexes/query plans from real p95/p99 metrics.
6. Add EAS build profiles, app signing, store assets, privacy labels, and release channels.
7. Provide production-sized infra credentials and staging capacity before attempting 100k load tests.
