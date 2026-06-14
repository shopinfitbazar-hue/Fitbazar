import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/logout",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/vendor/register",
  "/api/auth",
  "/api/upload",
  "/api/vendor/register",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

const PROTECTED_ROUTES = [
  "/admin",
  "/vendor",
  "/account",
  "/api/admin",
  "/api/vendor",
  "/api/account",
  "/api/notifications",
];

const SENSITIVE_PATH_PATTERNS = [
  /^\/(?:\.env|\.env\..*|\.git|\.svn|\.hg)(?:\/|$)/i,
  /^\/(?:package(?:-lock)?\.json|yarn\.lock|pnpm-lock\.yaml|next\.config\.mjs|tsconfig\.json|prisma\/schema\.prisma)$/i,
  /\.(?:key|pem|p12|pfx|sql|sqlite|sqlite3|db|bak|backup|dump)$/i,
];

const rateLimitBuckets = new Map<string, RateLimitBucket>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_RATE_LIMIT_BUCKETS = 10_000;

function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
}

function isProtectedRoute(path: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
}

function isSensitivePath(path: string): boolean {
  return SENSITIVE_PATH_PATTERNS.some((pattern) => pattern.test(path));
}

function getRequestIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function getRateLimit(path: string) {
  if (
    path.startsWith("/api/auth") ||
    path === "/login" ||
    path === "/signup" ||
    path === "/forgot-password" ||
    path === "/reset-password" ||
    path === "/verify-email"
  ) {
    return 30;
  }

  if (path.startsWith("/api/admin") || path.startsWith("/admin")) return 300;
  if (path.startsWith("/api/vendor") || path.startsWith("/vendor")) return 300;
  if (path.startsWith("/api/analytics/track")) return 240;

  if (
    path.startsWith("/api/cart") ||
    path.startsWith("/api/orders") ||
    path.startsWith("/api/payments") ||
    path.startsWith("/api/reviews") ||
    path.startsWith("/api/support") ||
    path.startsWith("/api/upload") ||
    path.startsWith("/api/wishlist")
  ) {
    return 120;
  }

  if (path.startsWith("/api")) return 360;
  return 900;
}

function pruneRateLimitBuckets(now: number) {
  if (rateLimitBuckets.size < MAX_RATE_LIMIT_BUCKETS) return;

  for (const [key, bucket] of Array.from(rateLimitBuckets.entries())) {
    if (bucket.resetAt <= now) rateLimitBuckets.delete(key);
    if (rateLimitBuckets.size < MAX_RATE_LIMIT_BUCKETS) return;
  }
}

function rateLimit(req: NextRequest, path: string) {
  if (req.method === "OPTIONS" || req.method === "HEAD") return null;

  const now = Date.now();
  const limit = getRateLimit(path);
  const ip = getRequestIp(req);
  const bucketKey = `${ip}:${path.startsWith("/api") ? path.split("/").slice(0, 3).join("/") : "page"}`;
  const bucket = rateLimitBuckets.get(bucketKey);

  if (!bucket || bucket.resetAt <= now) {
    pruneRateLimitBuckets(now);
    rateLimitBuckets.set(bucketKey, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return null;
  }

  bucket.count += 1;
  if (bucket.count <= limit) return null;

  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  const response = path.startsWith("/api")
    ? NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 })
    : new NextResponse("Too many requests. Please try again shortly.", { status: 429 });
  response.headers.set("Retry-After", String(retryAfter));
  response.headers.set("X-RateLimit-Limit", String(limit));
  response.headers.set("X-RateLimit-Remaining", "0");
  return response;
}

function redirectToLogin(req: NextRequest) {
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (isSensitivePath(path)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const rateLimitResponse = rateLimit(req, path);
  if (rateLimitResponse) return rateLimitResponse;

  if (isPublicRoute(path)) {
    return NextResponse.next();
  }

  if (!isProtectedRoute(path)) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return redirectToLogin(req);
  }

  if (path.startsWith("/admin") && token.role !== "ADMIN") {
    const unauthorizedUrl = new URL("/unauthorized", req.url);
    return NextResponse.redirect(unauthorizedUrl);
  }

  if (path.startsWith("/vendor") && token.role !== "VENDOR" && token.role !== "ADMIN") {
    const unauthorizedUrl = new URL("/unauthorized", req.url);
    return NextResponse.redirect(unauthorizedUrl);
  }

  if (path.startsWith("/api/admin") && token.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (path.startsWith("/api/vendor") && token.role !== "VENDOR" && token.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:jpg|jpeg|png|gif|webp|avif|svg|ico|css|js|map|txt|xml|woff|woff2)$).*)",
  ],
};
