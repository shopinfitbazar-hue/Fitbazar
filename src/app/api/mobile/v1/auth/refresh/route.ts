import { NextResponse } from "next/server";
import { MobileAuthError, refreshMobileSession } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const session = await refreshMobileSession({
      refreshToken: body.refreshToken,
      deviceId: body.deviceId,
    });

    return NextResponse.json(session);
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Mobile refresh error:", error);
    return NextResponse.json({ error: "Unable to refresh session right now." }, { status: 500 });
  }
}
