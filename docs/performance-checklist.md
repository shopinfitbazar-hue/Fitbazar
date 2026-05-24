# Fit Bazzar Performance Checklist

- Use Cloudinary-hosted product and banner media wherever possible.
- Keep above-the-fold home hero images under 250 KB in AVIF or WebP.
- Prefer server-rendered data for catalog landing pages and cache anonymous traffic.
- Audit client components and move non-interactive sections back to the server when practical.
- Keep product-card payloads small: no unused fields in `/api/products`.
- Validate Lighthouse on mobile for home, listing, PDP, and checkout flows.
- Avoid autoplay video in the first viewport; defer heavy media until interaction.
- Track CLS on banners and galleries by preserving aspect ratios for every media slot.
