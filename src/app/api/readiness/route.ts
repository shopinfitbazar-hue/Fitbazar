import { NextResponse } from "next/server";
import { privateNoStoreHeaders } from "@/lib/cache-control";
import { safeErrorMessage } from "@/lib/log-redaction";
import { prisma } from "@/lib/prisma";
import { checkRedisCacheHealth } from "@/lib/redis-cache";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = performance.now();
  const checks: Record<string, unknown> = {};
  let ready = true;

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { ok: true };
  } catch (error) {
    ready = false;
    checks.database = { ok: false, error: safeErrorMessage(error) };
  }

  const redis = await checkRedisCacheHealth();
  checks.redis = redis.configured
    ? { ok: redis.ok, required: false }
    : { ok: true, configured: false, required: false };

  return NextResponse.json(
    {
      ok: ready,
      checks,
      latencyMs: Math.round(performance.now() - startedAt),
      timestamp: new Date().toISOString(),
    },
    {
      status: ready ? 200 : 503,
      headers: privateNoStoreHeaders(),
    },
  );
}
