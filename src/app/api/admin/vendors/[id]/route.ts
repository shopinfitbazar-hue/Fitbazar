import { NextResponse } from "next/server";
import { buildAbsoluteAppUrl } from "@/lib/app-url";
import { renderVendorUpdateEmail } from "@/lib/email-templates";
import { hasConfiguredMailTransport, sendMail } from "@/lib/mailer";
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
            name: true,
            email: true,
          },
        },
      },
    });

    const vendorMessage = vendor.isSuspended
      ? "your vendor account has been suspended. Please contact Vendor Support if you need help."
      : vendor.isApproved
        ? "your vendor account has been approved. You can manage your store from the vendor dashboard."
        : "your vendor account status has been updated. Please check your dashboard for details.";

    await prisma.notification.create({
      data: {
        userId: vendor.user.id,
        title: "Vendor account updated",
        message: vendorMessage,
        type: "VENDOR",
        link: "/vendor/dashboard",
      },
    }).catch(() => undefined);

    if (hasConfiguredMailTransport()) {
      await sendMail({
        to: vendor.user.email,
        from: process.env.VENDOR_SUPPORT_EMAIL_FROM || "vendorSupport@fitbazar.com",
        subject: "Fit Bazar vendor account update",
        text: `Hello ${vendor.user.name || vendor.shopName}, ${vendorMessage}`,
        html: renderVendorUpdateEmail(
          vendor.user.name || vendor.shopName,
          "Vendor account updated",
          vendorMessage,
          buildAbsoluteAppUrl("/vendor/dashboard"),
        ),
      }).catch(() => undefined);
    }

    return NextResponse.json({ vendor });
  } catch (error) {
    console.error("Error updating vendor:", error);
    return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 });
  }
}
