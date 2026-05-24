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
    const body = (await request.json()) as {
      isApproved?: boolean;
      isSuspended?: boolean;
      isPartnered?: boolean;
      isTopShop?: boolean;
      verificationStatus?: string;
      adminNotes?: string;
    };

    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        ...(body.isApproved !== undefined ? { isApproved: body.isApproved } : {}),
        ...(body.isSuspended !== undefined ? { isSuspended: body.isSuspended } : {}),
        ...(body.isPartnered !== undefined ? { isPartnered: body.isPartnered } : {}),
        ...(body.isTopShop !== undefined ? { isTopShop: body.isTopShop } : {}),
        ...(body.verificationStatus !== undefined ? { verificationStatus: body.verificationStatus.trim().toUpperCase() } : {}),
        ...(body.adminNotes !== undefined ? { adminNotes: body.adminNotes.trim() || null } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    await prisma.notification.create({
      data: {
        userId: vendor.user.id,
        title: "Vendor account updated",
        message: vendor.isSuspended
          ? "Your vendor account has been suspended."
          : vendor.isApproved
            ? "Your vendor account has been approved."
            : "Your vendor account status has been updated.",
        type: "VENDOR",
        link: "/vendor/dashboard",
      },
    }).catch(() => undefined);

    return NextResponse.json({ vendor });
  } catch (error) {
    console.error("Error updating vendor:", error);
    return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 });
  }
}
