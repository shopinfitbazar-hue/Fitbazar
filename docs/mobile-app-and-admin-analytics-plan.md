# Mobile Apps + Unified Admin Plan

## Professional Direction

Fit Bazar should use one shared backend and database for the website, customer app, vendor app, and admin panel.

- Website: current Next.js storefront and admin panel.
- Customer app: Expo React Native app focused on simple shopping.
- Vendor app: Expo React Native app focused on product uploads, orders, inventory, payouts, and support.
- Admin panel: remains the central web control room for products, vendors, customers, orders, content, support, notifications, analytics, and platform settings.
- Database: one Prisma/PostgreSQL source of truth so product, order, user, vendor, payment, and analytics data stays the same everywhere.

Do not create separate databases for mobile apps. The apps should use authenticated API routes from the current backend.

## Customer App MVP

- Home feed with banners, categories, deals, new arrivals, and top shops.
- Search with filters for category, size, color, price, stock, and discount.
- Product details with photos, size/color selection, reviews, wishlist, and add to cart.
- Fast cart and checkout using the same payment methods as the website.
- Account area for profile, addresses, orders, wishlist, notifications, support, and reviews.
- Push notifications for order updates, offers, and support replies.

## Vendor App MVP

- Vendor dashboard with sales, orders, stock alerts, and payout summary.
- Product creation with camera/gallery upload, sizes, colors, price, stock, and draft submission.
- Order management with status updates and customer delivery details.
- Store profile, banking summary, support, and admin review status.
- Push notifications for new orders, approval decisions, disputes, and payouts.

## Shared API Requirements

- Add mobile-friendly auth using secure token sessions while keeping NextAuth for web.
- Version mobile APIs under `/api/mobile/v1/*` once native app scaffolding starts.
- Keep role checks server-side: customer endpoints require customer accounts; vendor endpoints require approved vendor access; admin endpoints stay admin-only.
- Reuse existing Prisma models for products, orders, cart, wishlist, reviews, support, notifications, and payments.
- Use Cloudinary uploads from mobile through the existing upload policy, with vendor/admin authorization.

## Analytics And Monitoring

The first analytics layer is now app-owned:

- `AnalyticsEvent` records page views and future app events.
- `PerformanceMetric` records page-load timing and future app performance metrics.
- `/api/analytics/track` accepts website, customer app, vendor app, and admin events.
- `/api/admin/analytics` summarizes visitors, signed-in users, app events, peak hours, top pages, device/channel breakdown, recent activity, and page-load speed.

For true hosting/load capacity, add external infrastructure monitoring:

- Hosting analytics for traffic, bandwidth, function duration, and errors.
- Database metrics for slow queries, connection pressure, and storage.
- Error tracking such as Sentry for web and React Native.
- Uptime checks for storefront, checkout, auth, and vendor/admin APIs.
- Load testing before major campaigns using the flows for home, search, product detail, cart, checkout, vendor dashboard, and admin dashboard.

## App Store Release Path

- Build with Expo React Native and EAS Build.
- Create separate bundle IDs/package names for customer and vendor apps.
- Use production API URLs only, never local URLs.
- Configure privacy policy, app screenshots, app icons, notification permissions, payment notes, and test accounts.
- Submit customer app to Google Play and Apple App Store first.
- Submit vendor app after vendor workflows are stable and admin moderation is ready.
- Keep web PWA install support as a bonus, not a replacement for native apps.

## Recommended Build Order

1. Harden backend API contracts for mobile auth, catalog, cart, checkout, orders, notifications, and vendor actions.
2. Build the customer app MVP.
3. Add push notifications and analytics events for customer journeys.
4. Build the vendor app MVP.
5. Add admin-side app controls, release flags, app version checks, and notification campaigns.
6. Run load testing and store submission checks before public launch.
