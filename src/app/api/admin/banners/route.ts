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

    const banners = await prisma.banner.findMany({
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error("Error fetching admin banners:", error);
    return NextResponse.json({ error: "Failed to fetch banners" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdminSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const body = (await request.json()) as {
      imageUrl?: string;
      title?: string;
      linkUrl?: string;
      isActive?: boolean;
      displayOrder?: number;
    };

    if (!body.imageUrl?.trim()) {
      return NextResponse.json({ error: "Banner image URL is required." }, { status: 400 });
    }

    const banner = await prisma.banner.create({
      data: {
        imageUrl: body.imageUrl.trim(),
        title: body.title?.trim() || null,
        linkUrl: body.linkUrl?.trim() || null,
        isActive: body.isActive ?? true,
        displayOrder: Number(body.displayOrder || 0),
      },
    });

    return NextResponse.json({ banner }, { status: 201 });
  } catch (error) {
    console.error("Error creating banner:", error);
    return NextResponse.json({ error: "Failed to create banner" }, { status: 500 });
  }
}
