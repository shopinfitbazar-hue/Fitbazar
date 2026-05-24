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

    const reviews = await prisma.vendorReview.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        vendor: {
          select: { id: true, shopName: true, slug: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Error fetching admin vendor reviews:", error);
    return NextResponse.json({ error: "Failed to fetch vendor reviews" }, { status: 500 });
  }
}
