import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBearerToken, loadMobileSession, MobileAuthError } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

const PLATFORMS = new Set(["ios", "android", "web"]);
const PROVIDERS = new Set(["EXPO", "FCM", "APNS"]);

function cleanString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

export async function POST(request: Request) {
  try {
    const auth = await loadMobileSession(getBearerToken(request.headers));
    const body = await request.json().catch(() => ({}));
    const platform = cleanString(body.platform, 24);
    const provider = cleanString(body.provider, 24);
    const deviceId = cleanString(body.deviceId, 128);
    const pushToken = cleanString(body.pushToken, 512);

    if (!platform || !PLATFORMS.has(platform) || !provider || !PROVIDERS.has(provider) || !deviceId || !pushToken) {
      return NextResponse.json({ error: "Invalid device token payload." }, { status: 400 });
    }

    await prisma.deviceToken.deleteMany({
      where: {
        pushToken,
        NOT: {
          userId: auth.user.id,
          app: auth.app,
          deviceId,
        },
      },
    });

    const deviceToken = await prisma.deviceToken.upsert({
      where: {
        userId_app_deviceId: {
          userId: auth.user.id,
          app: auth.app,
          deviceId,
        },
      },
      create: {
        userId: auth.user.id,
        app: auth.app,
        platform,
        provider,
        deviceId,
        pushToken,
        lastSeenAt: new Date(),
      },
      update: {
        platform,
        provider,
        pushToken,
        lastSeenAt: new Date(),
      },
    });

    return NextResponse.json({ deviceToken });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Mobile device registration error:", error);
    return NextResponse.json({ error: "Unable to register device right now." }, { status: 500 });
  }
}
