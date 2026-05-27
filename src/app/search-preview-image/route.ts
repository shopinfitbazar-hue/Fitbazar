import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SITE_SETTINGS_ID, cleanSeoImageUrl, defaultSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  let image = defaultSiteSettings.seoImage;

  try {
    const settings =
      (await prisma.siteSettings.findUnique({
        where: { id: SITE_SETTINGS_ID },
        select: { seoImage: true },
      })) ||
      (await prisma.siteSettings.findFirst({
        select: { seoImage: true },
      }));

    image = cleanSeoImageUrl(settings?.seoImage, defaultSiteSettings.seoImage);
  } catch (error) {
    console.error("Error resolving SEO image:", error);
  }

  const url = new URL(image, request.url);
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  return response;
}
