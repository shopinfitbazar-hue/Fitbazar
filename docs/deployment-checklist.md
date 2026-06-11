# Fit Bazzar Deployment Checklist

- Set `NEXT_PUBLIC_SITE_URL` and `NEXTAUTH_URL` to the exact production domain, for example `https://fit-bazar.com`.
- Set `NEXTAUTH_SECRET` to a long random value.
- Configure `DATABASE_URL` and `DIRECT_URL` for Neon/Postgres.
- Vercel should run the default `npm run build`; it now runs `prisma migrate deploy` before `next build`.
- Use `npm run db:deploy` only when you need to apply migrations manually.
- Configure Cloudinary env vars: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_URL`, and any upload preset in use.
- Configure payment gateway secrets only on the server environment.
- Configure Resend credentials for password reset and verification emails.
- Configure `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` if Sentry is enabled in production.
- Verify Vercel project settings use Node.js compatible with Next 14.
- Run `npm run build:local`, `npm test`, and `npx tsc --noEmit` before each release when you do not want local checks to touch the database.
- Run `npm run load:test` against staging or production after deploy for a traffic smoke test.
- Confirm checkout, auth, upload, and vendor/admin flows against the production domain.
