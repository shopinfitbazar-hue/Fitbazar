import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

type SummaryRow = {
  totalEvents: number;
  pageViews: number;
  uniqueVisitors: number;
  signedInVisitors: number;
  mobileEvents: number;
};

type CountRow = {
  label: string | null;
  count: number;
};

type PeakHourRow = {
  hour: number;
  count: number;
};

type DailyRow = {
  date: string;
  count: number;
};

type PerformanceRow = {
  path: string | null;
  averageMs: number;
  samples: number;
};

function clampDays(value: string | null) {
  const parsed = Number(value || 30);
  if (!Number.isFinite(parsed)) return 30;
  return Math.min(Math.max(Math.trunc(parsed), 1), 90);
}

function normalizeCount(value: unknown) {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  return Number(value || 0);
}

function normalizeRows<T extends Record<string, unknown>>(rows: T[]) {
  return rows.map((row) =>
    Object.fromEntries(Object.entries(row).map(([key, value]) => [key, typeof value === "bigint" ? Number(value) : value])),
  );
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdminSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const url = new URL(request.url);
    const days = clampDays(url.searchParams.get("days"));
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      summaryRows,
      topPagesRows,
      channelRows,
      deviceRows,
      peakHourRows,
      dailyRows,
      performanceRows,
      orderCount,
      recentEvents,
    ] = await Promise.all([
      prisma.$queryRaw<SummaryRow[]>`
        SELECT
          COUNT(*)::integer AS "totalEvents",
          COUNT(*) FILTER (WHERE "eventType" = 'page_view')::integer AS "pageViews",
          COUNT(DISTINCT COALESCE("userId", "anonymousId"))::integer AS "uniqueVisitors",
          COUNT(DISTINCT "userId")::integer AS "signedInVisitors",
          COUNT(*) FILTER (WHERE "channel" IN ('CUSTOMER_APP', 'VENDOR_APP'))::integer AS "mobileEvents"
        FROM "AnalyticsEvent"
        WHERE "createdAt" >= ${startDate}
      `,
      prisma.$queryRaw<CountRow[]>`
        SELECT "path" AS "label", COUNT(*)::integer AS "count"
        FROM "AnalyticsEvent"
        WHERE "createdAt" >= ${startDate}
          AND "eventType" = 'page_view'
          AND "path" IS NOT NULL
        GROUP BY "path"
        ORDER BY "count" DESC
        LIMIT 8
      `,
      prisma.$queryRaw<CountRow[]>`
        SELECT "channel" AS "label", COUNT(*)::integer AS "count"
        FROM "AnalyticsEvent"
        WHERE "createdAt" >= ${startDate}
        GROUP BY "channel"
        ORDER BY "count" DESC
      `,
      prisma.$queryRaw<CountRow[]>`
        SELECT COALESCE("deviceType", 'UNKNOWN') AS "label", COUNT(*)::integer AS "count"
        FROM "AnalyticsEvent"
        WHERE "createdAt" >= ${startDate}
        GROUP BY COALESCE("deviceType", 'UNKNOWN')
        ORDER BY "count" DESC
      `,
      prisma.$queryRaw<PeakHourRow[]>`
        SELECT EXTRACT(HOUR FROM "createdAt" AT TIME ZONE 'Asia/Kathmandu')::integer AS "hour",
          COUNT(*)::integer AS "count"
        FROM "AnalyticsEvent"
        WHERE "createdAt" >= ${startDate}
        GROUP BY "hour"
        ORDER BY "count" DESC
        LIMIT 8
      `,
      prisma.$queryRaw<DailyRow[]>`
        SELECT TO_CHAR(date_trunc('day', "createdAt" AT TIME ZONE 'Asia/Kathmandu'), 'YYYY-MM-DD') AS "date",
          COUNT(*)::integer AS "count"
        FROM "AnalyticsEvent"
        WHERE "createdAt" >= ${startDate}
        GROUP BY date_trunc('day', "createdAt" AT TIME ZONE 'Asia/Kathmandu')
        ORDER BY "date" ASC
      `,
      prisma.$queryRaw<PerformanceRow[]>`
        SELECT "path" AS "path",
          ROUND(AVG("value"))::integer AS "averageMs",
          COUNT(*)::integer AS "samples"
        FROM "PerformanceMetric"
        WHERE "createdAt" >= ${startDate}
          AND "metricName" = 'page_load_ms'
        GROUP BY "path"
        ORDER BY "samples" DESC
        LIMIT 8
      `,
      prisma.order.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),
      prisma.analyticsEvent.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          eventType: true,
          channel: true,
          path: true,
          anonymousId: true,
          deviceType: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
    ]);

    const summary = summaryRows[0] || {
      totalEvents: 0,
      pageViews: 0,
      uniqueVisitors: 0,
      signedInVisitors: 0,
      mobileEvents: 0,
    };

    return NextResponse.json({
      range: {
        days,
        startDate,
        endDate: new Date(),
      },
      summary: {
        totalEvents: normalizeCount(summary.totalEvents),
        pageViews: normalizeCount(summary.pageViews),
        uniqueVisitors: normalizeCount(summary.uniqueVisitors),
        signedInVisitors: normalizeCount(summary.signedInVisitors),
        mobileEvents: normalizeCount(summary.mobileEvents),
        orders: orderCount,
      },
      topPages: normalizeRows(topPagesRows),
      channels: normalizeRows(channelRows),
      devices: normalizeRows(deviceRows),
      peakHours: normalizeRows(peakHourRows),
      daily: normalizeRows(dailyRows),
      performance: normalizeRows(performanceRows),
      recentEvents,
    });
  } catch (error) {
    console.error("Error fetching admin analytics:", error);
    return NextResponse.json({ error: "Failed to fetch admin analytics" }, { status: 500 });
  }
}
