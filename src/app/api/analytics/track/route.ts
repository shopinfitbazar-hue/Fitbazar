import { createHash } from "crypto";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CHANNELS = new Set(["WEB", "CUSTOMER_APP", "VENDOR_APP", "ADMIN"]);

function cleanString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function cleanNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function cleanMetadata(value: unknown) {
  if (!value || typeof value !== "object") return undefined;

  try {
    const serialized = JSON.stringify(value);
    if (serialized.length > 4000) return undefined;
    return JSON.parse(serialized);
  } catch {
    return undefined;
  }
}

function detectDevice(userAgent: string | null) {
  const agent = (userAgent || "").toLowerCase();
  if (!agent) return "UNKNOWN";
  if (/ipad|tablet/.test(agent)) return "TABLET";
  if (/mobi|android|iphone|ipod/.test(agent)) return "MOBILE";
  return "DESKTOP";
}

function hashIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
  if (!ipAddress) return null;

  const salt = process.env.ANALYTICS_HASH_SALT || process.env.NEXTAUTH_SECRET || "fit-bazar-analytics";
  return createHash("sha256").update(`${salt}:${ipAddress}`).digest("hex");
}

async function getOptionalUserId() {
  try {
    const session = await getServerSession(authOptions);
    return session?.user?.id || null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid analytics payload" }, { status: 400 });
  }

  const channelInput = cleanString(body.channel, 32) || "WEB";
  const channel = CHANNELS.has(channelInput) ? channelInput : "WEB";
  const anonymousId = cleanString(body.anonymousId, 128);
  const path = cleanString(body.path, 512);
  const metadata = cleanMetadata(body.metadata);
  const userId = await getOptionalUserId();

  const metricName = cleanString(body.metricName, 64);
  if (metricName) {
    const value = cleanNumber(body.value);
    if (value === null) {
      return NextResponse.json({ error: "Invalid metric value" }, { status: 400 });
    }

    await prisma.performanceMetric.create({
      data: {
        userId,
        anonymousId,
        channel,
        path,
        metricName,
        value,
        unit: cleanString(body.unit, 16) || "ms",
        metadata,
      },
    });

    return new NextResponse(null, { status: 204 });
  }

  const eventType = cleanString(body.eventType, 64);
  if (!eventType) {
    return NextResponse.json({ error: "Missing event type" }, { status: 400 });
  }

  const userAgent = cleanString(request.headers.get("user-agent"), 512);

  await prisma.analyticsEvent.create({
    data: {
      userId,
      anonymousId,
      channel,
      eventType,
      path,
      referrer: cleanString(body.referrer, 512),
      userAgent,
      ipHash: hashIp(request),
      deviceType: detectDevice(userAgent),
      metadata,
    },
  });

  return new NextResponse(null, { status: 204 });
}
