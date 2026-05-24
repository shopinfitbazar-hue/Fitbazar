import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

function redirectToLogin(req: NextRequest) {
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const path = req.nextUrl.pathname;

  if (path === "/vendor/register") {
    return NextResponse.next();
  }

  if (!token) {
    return redirectToLogin(req);
  }

  if (path.startsWith("/admin") && token.role !== "ADMIN") {
    return redirectToLogin(req);
  }

  if (path.startsWith("/vendor") && token.role !== "VENDOR" && token.role !== "ADMIN") {
    return redirectToLogin(req);
  }

  if (path.startsWith("/account")) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/vendor/:path*", "/admin/:path*", "/account/:path*"],
};
