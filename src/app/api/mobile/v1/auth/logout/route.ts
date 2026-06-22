import { NextResponse } from "next/server";
import { getBearerToken, revokeMobileSession } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    await revokeMobileSession({
      accessToken: getBearerToken(request.headers),
      refreshToken: body.refreshToken,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mobile logout error:", error);
    return NextResponse.json({ error: "Unable to sign out right now." }, { status: 500 });
  }
}
