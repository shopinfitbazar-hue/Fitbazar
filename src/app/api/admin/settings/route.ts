import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAdminSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const settings = (await prisma.siteSettings.findUnique({
      where: { id: "site-settings" },
    })) || (await prisma.siteSettings.findFirst());
    return NextResponse.json({
      settings: settings || {
        commissionPct: 8,
        minFreeDelivery: 2000,
        whatsappNumber: "977XXXXXXXXX",
        announcementBar: "",
        announcementActive: false,
        supportEmail: "support@fitbazar.com",
        supportPhone: "+977 9800000000",
        supportHours: "Sun-Fri, 10am-6pm",
      },
    });
  } catch (error) {
    console.error("Error fetching admin settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAdminSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const body = (await request.json()) as {
      commissionPct?: number;
      minFreeDelivery?: number;
      whatsappNumber?: string;
      announcementBar?: string;
      announcementActive?: boolean;
      supportEmail?: string;
      supportPhone?: string;
      supportHours?: string;
    };

    const settings = await prisma.siteSettings.upsert({
      where: { id: "site-settings" },
      update: {
        commissionPct: Number(body.commissionPct || 8),
        minFreeDelivery: Number(body.minFreeDelivery || 2000),
        whatsappNumber: body.whatsappNumber?.trim() || "977XXXXXXXXX",
        announcementBar: body.announcementBar?.trim() || null,
        announcementActive: Boolean(body.announcementActive),
        supportEmail: body.supportEmail?.trim() || "support@fitbazar.com",
        supportPhone: body.supportPhone?.trim() || "+977 9800000000",
        supportHours: body.supportHours?.trim() || null,
      },
      create: {
        id: "site-settings",
        commissionPct: Number(body.commissionPct || 8),
        minFreeDelivery: Number(body.minFreeDelivery || 2000),
        whatsappNumber: body.whatsappNumber?.trim() || "977XXXXXXXXX",
        announcementBar: body.announcementBar?.trim() || null,
        announcementActive: Boolean(body.announcementActive),
        supportEmail: body.supportEmail?.trim() || "support@fitbazar.com",
        supportPhone: body.supportPhone?.trim() || "+977 9800000000",
        supportHours: body.supportHours?.trim() || null,
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error updating admin settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
