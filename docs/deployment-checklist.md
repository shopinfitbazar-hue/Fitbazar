# Fit Bazzar Deployment Checklist

- Set `NEXT_PUBLIC_SITE_URL` and `NEXTAUTH_URL` to the exact production domain, for example `https://fit-bazar.com`.
- Set `NEXTAUTH_SECRET` to a long random value.
- Configure `DATABASE_URL` and `DIRECT_URL` for Neon/Postgres.
- Run `npx prisma migrate deploy` against production after schema changes.
- Configure Cloudinary env vars: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_URL`, and any upload preset in use.
- Configure payment gateway secrets only on the server environment.
- Configure Resend credentials for password reset and verification emails.
- Configure `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` if Sentry is enabled in production.
- Verify Vercel project settings use Node.js compatible with Next 14.
- Run `npm run build`, `npm test`, and `npx tsc --noEmit` before each release.
- Confirm checkout, auth, upload, and vendor/admin flows against the production domain.
