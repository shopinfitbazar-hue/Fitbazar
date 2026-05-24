import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = (await prisma.siteSettings.findUnique({
      where: { id: "site-settings" },
    })) || (await prisma.siteSettings.findFirst());
    
    if (!settings) {
      return NextResponse.json({
        announcementBar: null,
        announcementActive: false,
        commissionPct: 8.0,
        minFreeDelivery: 2000,
        whatsappNumber: "9779841234567",
        supportEmail: "support@fitbazar.com",
        supportPhone: "+977 9800000000",
        supportHours: "Sun-Fri, 10am-6pm",
      });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching site settings:", error);
    return NextResponse.json({ error: "Failed to fetch site settings" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    const settings = await prisma.siteSettings.upsert({
      where: { id: "site-settings" },
      update: body,
      create: {
        id: "site-settings",
        ...body,
      },
    });
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating site settings:", error);
    return NextResponse.json({ error: "Failed to update site settings" }, { status: 500 });
  }
}
