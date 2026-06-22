import { NextResponse } from "next/server";
import { getBearerToken, loadMobileSession, MobileAuthError } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await loadMobileSession(getBearerToken(request.headers));

    return NextResponse.json({
      user: auth.user,
      app: auth.app,
      session: {
        id: auth.session.id,
        expiresAt: auth.session.expiresAt,
        refreshExpiresAt: auth.session.refreshExpiresAt,
        lastUsedAt: auth.session.lastUsedAt,
      },
    });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Mobile me error:", error);
    return NextResponse.json({ error: "Unable to load account right now." }, { status: 500 });
  }
}
