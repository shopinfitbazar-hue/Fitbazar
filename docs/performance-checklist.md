# Fit Bazzar Performance Checklist

- Use Cloudinary-hosted product and banner media wherever possible.
- Keep above-the-fold home hero images under 250 KB in AVIF or WebP.
- Prefer server-rendered data for catalog landing pages and cache anonymous traffic.
- Keep `/products`, `/search`, collection, and vendor storefront routes on cached server data for first render.
- Keep public catalog/search APIs cacheable unless the request depends on a logged-in user.
- Audit client components and move non-interactive sections back to the server when practical.
- Keep product-card payloads small: no unused fields in `/api/products`.
- Validate Lighthouse on mobile for home, listing, PDP, and checkout flows.
- Run `npm run load:test` against staging after large catalog/search/admin changes.
- Avoid autoplay video in the first viewport; defer heavy media until interaction.
- Track CLS on banners and galleries by preserving aspect ratios for every media slot.
