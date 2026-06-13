import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidateTag, unstable_cache } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SITE_SETTINGS_ID, defaultSiteSettings } from "@/lib/site-settings";
import { PUBLIC_CATALOG_REVALIDATE_SECONDS, publicCatalogCacheHeaders } from "@/lib/public-catalog";

export const dynamic = "force-dynamic";
export const revalidate = PUBLIC_CATALOG_REVALIDATE_SECONDS;

const getCachedPublicSiteSettings = unstable_cache(
  async () =>
    (await prisma.siteSettings.findUnique({
      where: { id: SITE_SETTINGS_ID },
      select: {
        announcementBar: true,
        announcementActive: true,
        commissionPct: true,
        minFreeDelivery: true,
        whatsappNumber: true,
        supportEmail: true,
        supportPhone: true,
        supportHours: true,
      },
    })) ||
    (await prisma.siteSettings.findFirst({
      select: {
        announcementBar: true,
        announcementActive: true,
        commissionPct: true,
        minFreeDelivery: true,
        whatsappNumber: true,
        supportEmail: true,
        supportPhone: true,
        supportHours: true,
      },
    })) ||
    defaultSiteSettings,
  ["public-site-settings"],
  {
    revalidate: PUBLIC_CATALOG_REVALIDATE_SECONDS,
    tags: ["public-site-settings"],
  },
);

export async function GET() {
  try {
    const settings = await getCachedPublicSiteSettings();

    return NextResponse.json(settings, {
      headers: publicCatalogCacheHeaders(PUBLIC_CATALOG_REVALIDATE_SECONDS),
    });
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
      where: { id: SITE_SETTINGS_ID },
      update: body,
      create: {
        id: SITE_SETTINGS_ID,
        ...body,
      },
    });

    revalidateTag("public-site-settings");
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating site settings:", error);
    return NextResponse.json({ error: "Failed to update site settings" }, { status: 500 });
  }
}
