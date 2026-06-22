import { NextResponse } from "next/server";
import { createMobileCustomerSession, MobileAuthError } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { hashOpaqueToken } from "@/lib/tokens";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body.code !== "string" || !body.code.trim()) {
      return NextResponse.json({ error: "Authorization code is required." }, { status: 400 });
    }

    const tokenHash = hashOpaqueToken(body.code);
    const userId = await prisma.$transaction(async (tx) => {
      const code = await tx.mobileAuthCode.findUnique({ where: { tokenHash }, select: { id: true, userId: true, expiresAt: true, usedAt: true } });
      if (!code || code.usedAt || code.expiresAt <= new Date()) return null;
      const consumed = await tx.mobileAuthCode.updateMany({ where: { id: code.id, usedAt: null }, data: { usedAt: new Date() } });
      return consumed.count ? code.userId : null;
    });

    if (!userId) return NextResponse.json({ error: "This Google sign-in link has expired. Please try again." }, { status: 401 });
    const session = await createMobileCustomerSession(userId, body.deviceId);
    return NextResponse.json(session, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof MobileAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Mobile Google exchange failed:", error);
    return NextResponse.json({ error: "Unable to complete Google sign-in." }, { status: 500 });
  }
}
