# Fit Bazar

Nepal-first multi-role fashion marketplace built with Next.js, NextAuth, Prisma 7, and Neon PostgreSQL.

## Quick Start

```bash
npm install
cp .env.example .env.local
npx prisma db seed
npm run dev -- --hostname localhost --port 3002
```

Open `http://localhost:3002`.

## Validation

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

## Seeded Accounts

- Admin: `admin@fitbazar.com` / `Admin@123`
- Vendor: `vendor@fitbazar.com` / `Vendor@123`
- Vendor 2: `vendor2@fitbazar.com` / `Vendor2@123`
- Customer: `customer@fitbazar.com` / `Customer@123`

## Authentication Setup

### Required NextAuth env

```env
NEXTAUTH_URL="http://localhost:3002"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
```

`NEXTAUTH_URL` must match the exact dev or production host you are actually using.

### Google Sign-In

Required env vars:

```env
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

Google Console configuration:

- Authorized JavaScript origin for local: `http://localhost:3002`
- Authorized redirect URI for local: `http://localhost:3002/api/auth/callback/google`
- Authorized redirect URI for production: `https://your-domain.com/api/auth/callback/google`

Behavior:

- If valid Google credentials are configured, Google Sign-In is enabled on `/login`.
- If they are missing, the login page falls back cleanly to email/password auth and shows a clear message.

### Forgot Password / Verification Email

Required SMTP env vars for real email delivery:

```env
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@fitbazar.com.np"
```

Behavior:

- `/forgot-password` sends a real reset email when SMTP is configured.
- `/reset-password` consumes the secure reset token and lets the user set a new password.
- `/verify-email` consumes signup/vendor verification tokens.
- In development only, if SMTP is not configured, the forgot-password API returns a manual reset link for testing.
- In production, SMTP must be configured for real reset-email delivery.

## Prisma / Database

This project uses Prisma 7 with Neon and Prisma config-driven datasource setup.

Production env rules:

- Set both `DATABASE_URL` and `DIRECT_URL` in Vercel.
- `DATABASE_URL` should be the pooled Neon connection string used by the running app.
- `DIRECT_URL` should be the direct Neon connection string used by Prisma tooling.
- Do not wrap values in quotes in the Vercel dashboard.
- After changing either value, redeploy so the runtime picks up the new credentials.

Useful commands:

```bash
npx prisma generate
npx prisma db seed
npm run build
```

Build note:

- Vercel and local installs run `prisma generate` automatically through `postinstall`.
- The production build also runs `prisma generate` before `next build` as a safety net.

## Launch Notes

- Run the app on the same host/port configured in `NEXTAUTH_URL`.
- Configure Google OAuth before enabling Google Sign-In publicly.
- Configure SMTP before relying on real password reset and verification emails in production.
- Configure payment gateway credentials before enabling live online payments.

## Payments Setup

Fit Bazar supports Nepal-first checkout methods:

- Cash on Delivery
- eSewa
- Khalti
- connectIPS
- Fonepay
- Local Cards via Khalti when card acceptance is enabled in Khalti merchant config

### Required env vars for online payments

```env
ESEWA_PRODUCT_CODE="EPAYTEST"
ESEWA_SECRET_KEY="8gBm/:&EnhH.1/q"
ESEWA_BASE_URL="https://rc-epay.esewa.com.np"
ESEWA_STATUS_BASE_URL="https://rc.esewa.com.np"

KHALTI_PUBLIC_KEY=""
KHALTI_SECRET_KEY=""
KHALTI_API_BASE_URL="https://dev.khalti.com/api/v2"
KHALTI_ENABLE_LOCAL_CARD="false"

CONNECTIPS_MERCHANT_ID=""
CONNECTIPS_APP_ID=""
CONNECTIPS_GATEWAY_URL=""
CONNECTIPS_VERIFY_URL=""

FONEPAY_MERCHANT_CODE=""
FONEPAY_GATEWAY_URL=""
FONEPAY_VERIFY_URL=""
```

### Local callback URLs

- Google OAuth callback:
  - `http://localhost:3002/api/auth/callback/google`
- Khalti return URL is generated automatically from `NEXTAUTH_URL`:
  - `http://localhost:3002/checkout/complete?method=KHALTI...`
- Local Cards via Khalti use the same hosted Khalti return flow:
  - `http://localhost:3002/checkout/complete?method=LOCAL_CARD...`
- eSewa success/failure URLs are generated automatically from `NEXTAUTH_URL`:
  - `http://localhost:3002/checkout/complete?method=ESEWA...`
- connectIPS return URL should point back to:
  - `http://localhost:3002/checkout/complete?method=CONNECTIPS...`
- Fonepay return URL should point back to:
  - `http://localhost:3002/checkout/complete?method=FONEPAY...`

### Payment flow behavior

- COD creates orders immediately with `paymentStatus=PENDING`.
- eSewa and Khalti only create orders after provider verification succeeds.
- Gateway verification happens server-side before stock is decremented and before coupon usage is committed.
- Local cards are only shown when Khalti is configured and `KHALTI_ENABLE_LOCAL_CARD=true`.
- connectIPS and Fonepay remain hidden until their merchant env vars are configured.
