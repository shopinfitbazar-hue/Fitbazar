import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const { id } = await params;
    const body = (await request.json()) as { isVisible?: boolean };

    if (body.isVisible === undefined) {
      return NextResponse.json({ error: "isVisible is required." }, { status: 400 });
    }

    const review = await prisma.vendorReview.update({
      where: { id },
      data: { isVisible: body.isVisible },
    });

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Error moderating vendor review:", error);
    return NextResponse.json({ error: "Failed to update vendor review" }, { status: 500 });
  }
}
