import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/server-auth";
import { SITE_SETTINGS_ID, cleanInternalHref, cleanSeoImageUrl, defaultSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAdminSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const settings = (await prisma.siteSettings.findUnique({
      where: { id: SITE_SETTINGS_ID },
    })) || (await prisma.siteSettings.findFirst());
    return NextResponse.json({ settings: settings || defaultSiteSettings });
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
      heroEyebrow?: string;
      heroTitle?: string;
      heroSubtitle?: string;
      heroPrimaryLabel?: string;
      heroPrimaryHref?: string;
      heroSecondaryLabel?: string;
      heroSecondaryHref?: string;
      seoImage?: string;
    };

    const data = {
      commissionPct: Number(body.commissionPct || defaultSiteSettings.commissionPct),
      minFreeDelivery: Number(body.minFreeDelivery || defaultSiteSettings.minFreeDelivery),
      whatsappNumber: body.whatsappNumber?.trim() || defaultSiteSettings.whatsappNumber,
      announcementBar: body.announcementBar?.trim() || null,
      announcementActive: Boolean(body.announcementActive),
      supportEmail: body.supportEmail?.trim() || defaultSiteSettings.supportEmail,
      supportPhone: body.supportPhone?.trim() || defaultSiteSettings.supportPhone,
      supportHours: body.supportHours?.trim() || null,
      heroEyebrow: body.heroEyebrow?.trim() || defaultSiteSettings.heroEyebrow,
      heroTitle: body.heroTitle?.trim() || defaultSiteSettings.heroTitle,
      heroSubtitle: body.heroSubtitle?.trim() || defaultSiteSettings.heroSubtitle,
      heroPrimaryLabel: body.heroPrimaryLabel?.trim() || defaultSiteSettings.heroPrimaryLabel,
      heroPrimaryHref: cleanInternalHref(body.heroPrimaryHref, defaultSiteSettings.heroPrimaryHref),
      heroSecondaryLabel: body.heroSecondaryLabel?.trim() || defaultSiteSettings.heroSecondaryLabel,
      heroSecondaryHref: cleanInternalHref(body.heroSecondaryHref, defaultSiteSettings.heroSecondaryHref),
      seoImage: cleanSeoImageUrl(body.seoImage, defaultSiteSettings.seoImage),
    };

    const settings = await prisma.siteSettings.upsert({
      where: { id: SITE_SETTINGS_ID },
      update: data,
      create: {
        id: SITE_SETTINGS_ID,
        ...data,
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error updating admin settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
