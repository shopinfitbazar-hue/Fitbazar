import { NextResponse } from "next/server";
import { authenticateMobileCredentials, MobileAuthError } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const session = await authenticateMobileCredentials({
      email: body.email,
      password: body.password,
      app: body.app,
      deviceId: body.deviceId,
    });

    return NextResponse.json(session);
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Mobile login error:", error);
    return NextResponse.json({ error: "Unable to sign in right now." }, { status: 500 });
  }
}
