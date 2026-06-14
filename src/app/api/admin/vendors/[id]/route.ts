import { NextResponse } from "next/server";
import { buildAbsoluteAppUrl } from "@/lib/app-url";
import { renderPartnerApprovedEmail, renderPartnerStatusEmail, renderVendorUpdateEmail } from "@/lib/email-templates";
import { hasConfiguredMailTransport, sendMail } from "@/lib/mailer";
import { getPartnerExpiry, getPartnerPlan, normalizePartnerPlan, PARTNER_STATUS_ACTIVE, PARTNER_STATUS_NONE, PARTNER_STATUS_REJECTED } from "@/lib/partner-program";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/server-auth";
import { revalidateStorefrontCache } from "@/lib/storefront-cache";

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
      partnerAction?: "APPROVE" | "RENEW" | "REMOVE" | "REJECT";
      partnerPlan?: string;
      partnerPaymentNote?: string;
    };

    const currentVendor = await prisma.vendor.findUnique({
      where: { id },
      select: {
        isApproved: true,
        isSuspended: true,
        isPartnered: true,
        isTopShop: true,
        partnerExpiresAt: true,
      },
    });

    if (!currentVendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const inferredPartnerAction =
      body.partnerAction ||
      (body.isPartnered === true && !currentVendor.isPartnered ? "APPROVE" : undefined) ||
      (body.isPartnered === false && currentVendor.isPartnered ? "REMOVE" : undefined);
    const selectedPartnerPlan = normalizePartnerPlan(body.partnerPlan);
    const partnerPlan = getPartnerPlan(selectedPartnerPlan);
    const partnerStartDate = new Date();
    const partnerExpiryBase =
      inferredPartnerAction === "RENEW" &&
      currentVendor.partnerExpiresAt &&
      currentVendor.partnerExpiresAt.getTime() > partnerStartDate.getTime()
        ? currentVendor.partnerExpiresAt
        : partnerStartDate;
    const partnerExpiryDate = getPartnerExpiry(partnerExpiryBase, selectedPartnerPlan);
    const nextIsPartnered =
      inferredPartnerAction === "APPROVE" || inferredPartnerAction === "RENEW"
        ? true
        : inferredPartnerAction === "REMOVE" || inferredPartnerAction === "REJECT"
          ? false
          : body.isPartnered !== undefined
            ? body.isPartnered
            : body.isTopShop === true
              ? true
              : undefined;
    const nextIsTopShop =
      inferredPartnerAction === "REMOVE" || inferredPartnerAction === "REJECT" || nextIsPartnered === false
        ? false
        : body.isTopShop;
    const touchesStorefront =
      body.isApproved !== undefined ||
      body.isSuspended !== undefined ||
      body.isPartnered !== undefined ||
      body.isTopShop !== undefined ||
      Boolean(inferredPartnerAction);

    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        ...(body.isApproved !== undefined ? { isApproved: body.isApproved } : {}),
        ...(body.isSuspended !== undefined ? { isSuspended: body.isSuspended } : {}),
        ...(nextIsPartnered !== undefined ? { isPartnered: nextIsPartnered } : {}),
        ...(nextIsTopShop !== undefined ? { isTopShop: nextIsTopShop } : {}),
        ...(inferredPartnerAction === "APPROVE" || inferredPartnerAction === "RENEW"
          ? {
              partnerStatus: PARTNER_STATUS_ACTIVE,
              partnerPlan: selectedPartnerPlan,
              partnerStartedAt: inferredPartnerAction === "APPROVE" ? partnerStartDate : undefined,
              partnerRenewedAt: partnerStartDate,
              partnerExpiresAt: partnerExpiryDate,
              partnerPaymentDue: partnerPlan.amount,
              partnerPaymentNote: body.partnerPaymentNote?.trim() || `Admin confirmed ${partnerPlan.label} payment.`,
            }
          : {}),
        ...(inferredPartnerAction === "REMOVE"
          ? {
              partnerStatus: PARTNER_STATUS_NONE,
              partnerPlan: null,
              partnerExpiresAt: null,
              partnerPaymentDue: null,
              partnerPaymentNote: body.partnerPaymentNote?.trim() || "Removed by admin.",
            }
          : {}),
        ...(inferredPartnerAction === "REJECT"
          ? {
              partnerStatus: PARTNER_STATUS_REJECTED,
              partnerPlan: null,
              partnerExpiresAt: null,
              partnerPaymentDue: null,
              partnerPaymentNote: body.partnerPaymentNote?.trim() || "Partner request rejected by admin.",
            }
          : {}),
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

    const partnerJustActivated = !currentVendor.isPartnered && vendor.isPartnered;
    const partnerRenewed =
      currentVendor.isPartnered &&
      vendor.isPartnered &&
      currentVendor.partnerExpiresAt?.getTime() !== vendor.partnerExpiresAt?.getTime();
    const partnerJustRemoved = currentVendor.isPartnered && !vendor.isPartnered;
    const vendorJustApproved = !currentVendor.isApproved && vendor.isApproved;
    const vendorJustSuspended = !currentVendor.isSuspended && vendor.isSuspended;

    const expiryText = vendor.partnerExpiresAt
      ? new Intl.DateTimeFormat("en-NP", { year: "numeric", month: "long", day: "numeric" }).format(vendor.partnerExpiresAt)
      : "";

    const notificationTitle = partnerJustActivated
      ? "Congratulations, Partner Shop activated"
      : partnerRenewed
        ? "Partner Shop plan renewed"
        : partnerJustRemoved
          ? "Partner Shop status removed"
          : vendorJustSuspended
            ? "Vendor account suspended"
            : vendorJustApproved
              ? "Vendor account approved"
              : "Vendor account updated";
    const vendorMessage = partnerJustActivated
      ? `congratulations, your Fit Bazar Partner Shop plan is active until ${expiryText}. Your shop is now eligible for stronger marketplace visibility, Top Shop placement review, campaign highlights, and priority promotion support.`
      : partnerRenewed
        ? `your Fit Bazar Partner Shop plan has been renewed until ${expiryText}. Thank you for continuing with the partner program.`
        : partnerJustRemoved
          ? "your Fit Bazar Partner Shop status has been removed. Your products can still be visible if your vendor account remains approved, but partner-only highlights are no longer active."
          : vendorJustSuspended
            ? "your vendor account has been suspended. Please contact Vendor Support if you need help."
            : vendorJustApproved
              ? "your vendor account has been approved. You can manage your store from the vendor dashboard."
              : "your vendor account status has been updated. Please check your dashboard for details.";

    await prisma.notification.create({
      data: {
        userId: vendor.user.id,
        title: notificationTitle,
        message: vendorMessage,
        type: partnerJustActivated || partnerRenewed || partnerJustRemoved ? "PARTNER" : "VENDOR",
        link: "/vendor/dashboard",
      },
    }).catch(() => undefined);

    if (hasConfiguredMailTransport()) {
      const dashboardUrl = buildAbsoluteAppUrl("/vendor/dashboard");
      await sendMail({
        to: vendor.user.email,
        from: process.env.VENDOR_SUPPORT_EMAIL_FROM || "vendorSupport@fitbazar.com",
        subject: partnerJustActivated ? "Congratulations, your Fit Bazar Partner Shop is active" : "Fit Bazar vendor account update",
        text: `Hello ${vendor.user.name || vendor.shopName}, ${vendorMessage}`,
        html: partnerJustActivated
          ? renderPartnerApprovedEmail(
              vendor.user.name || vendor.shopName,
              partnerPlan.label,
              expiryText,
              dashboardUrl,
            )
          : partnerRenewed || partnerJustRemoved
            ? renderPartnerStatusEmail(vendor.user.name || vendor.shopName, notificationTitle, vendorMessage, dashboardUrl)
            : renderVendorUpdateEmail(
                vendor.user.name || vendor.shopName,
                notificationTitle,
                vendorMessage,
                dashboardUrl,
              ),
      }).catch(() => undefined);
    }

    if (touchesStorefront) {
      revalidateStorefrontCache();
    }

    return NextResponse.json({ vendor });
  } catch (error) {
    console.error("Error updating vendor:", error);
    return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 });
  }
}
