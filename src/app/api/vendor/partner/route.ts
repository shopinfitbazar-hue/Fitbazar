import { NextResponse } from "next/server";
import { buildAbsoluteAppUrl } from "@/lib/app-url";
import { renderPartnerApplicationEmail } from "@/lib/email-templates";
import { hasConfiguredMailTransport, sendMail } from "@/lib/mailer";
import { formatPartnerAmount, getPartnerPlan, normalizePartnerPlan, PARTNER_STATUS_PENDING } from "@/lib/partner-program";
import { prisma } from "@/lib/prisma";
import { requireVendorSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireVendorSession({ allowPending: true });
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: auth.vendor.id },
      select: {
        id: true,
        shopName: true,
        isApproved: true,
        isSuspended: true,
        isPartnered: true,
        partnerStatus: true,
        partnerPlan: true,
        partnerRequestedAt: true,
        partnerStartedAt: true,
        partnerExpiresAt: true,
        partnerRenewedAt: true,
        partnerPaymentDue: true,
        partnerPaymentNote: true,
      },
    });

    return NextResponse.json({ vendor });
  } catch (error) {
    console.error("Error fetching partner status:", error);
    return NextResponse.json({ error: "Failed to fetch partner status" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireVendorSession({ allowPending: true });
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const body = (await request.json()) as {
      plan?: string;
      paymentNote?: string;
    };
    const planKey = normalizePartnerPlan(body.plan);
    const plan = getPartnerPlan(planKey);
    const now = new Date();

    const vendor = await prisma.vendor.update({
      where: { id: auth.vendor.id },
      data: {
        partnerStatus: PARTNER_STATUS_PENDING,
        partnerPlan: planKey,
        partnerRequestedAt: now,
        partnerPaymentDue: plan.amount,
        partnerPaymentNote: body.paymentNote?.trim() || `Vendor selected ${plan.label}. Awaiting admin payment confirmation.`,
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

    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    await prisma.notification.createMany({
      data: [
        {
          userId: vendor.user.id,
          title: vendor.isPartnered ? "Partner renewal request received" : "Partner application received",
          message: `Your ${plan.label} request for ${formatPartnerAmount(plan.amount)} is waiting for admin payment confirmation.`,
          type: "PARTNER",
          link: "/vendor/partner",
        },
        ...adminUsers.map((admin) => ({
          userId: admin.id,
          title: "Partner payment review needed",
          message: `${vendor.shopName} requested ${plan.label} for ${formatPartnerAmount(plan.amount)}.`,
          type: "PARTNER",
          link: "/admin#vendors",
        })),
      ],
    }).catch(() => undefined);

    if (hasConfiguredMailTransport()) {
      await sendMail({
        to: vendor.user.email,
        subject: "Fit Bazar partner application received",
        text: `Hello ${vendor.user.name || vendor.shopName}, your ${plan.label} request for ${formatPartnerAmount(plan.amount)} is waiting for admin payment confirmation.`,
        html: renderPartnerApplicationEmail(
          vendor.user.name || vendor.shopName,
          plan.label,
          formatPartnerAmount(plan.amount),
          buildAbsoluteAppUrl("/vendor/partner"),
        ),
      }).catch(() => undefined);
    }

    return NextResponse.json({ vendor });
  } catch (error) {
    console.error("Error submitting partner request:", error);
    return NextResponse.json({ error: "Failed to submit partner request" }, { status: 500 });
  }
}
