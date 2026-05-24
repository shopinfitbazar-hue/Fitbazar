# Fit Bazzar Scaling Recommendations

- Move storefront product listing and search results to cache-friendly server components as traffic grows.
- Introduce edge caching or ISR for anonymous catalog and vendor pages.
- Add Algolia/Meilisearch style indexed search once product volume grows beyond basic database search.
- Separate admin and vendor analytics queries from shopper-facing workloads.
- Add queue-backed image/video ingestion for bulk seller uploads.
- Add CDN-backed event tracking and real monitoring for Core Web Vitals and checkout conversion.
- Adopt full `@sentry/nextjs` instrumentation when package installation is available.
