import { NextResponse } from "next/server";
import { buildAbsoluteAppUrl } from "@/lib/app-url";
import {
  buildBroadcastRecipientReport,
  escapeHtml,
  getRecipientNotificationLink,
  normalizeBroadcastAudience,
  normalizeBroadcastLink,
  validateBroadcastContent,
} from "@/lib/admin-notifications";
import { hasConfiguredMailTransport, sendMail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = await requireAdminSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const body = (await request.json()) as {
      audience?: string;
      title?: string;
      message?: string;
      link?: string;
      sendEmail?: boolean;
    };

    const validation = validateBroadcastContent({ title: body.title, message: body.message });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { title, message } = validation;
    const audience = normalizeBroadcastAudience(body.audience);
    const link = normalizeBroadcastLink(body.link);

    const recipients = await prisma.user.findMany({
      where:
        audience === "ALL"
          ? { role: { in: ["CUSTOMER", "VENDOR"] } }
          : { role: audience === "VENDORS" ? "VENDOR" : "CUSTOMER" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!recipients.length) {
      return NextResponse.json({ error: "No recipients found for this audience." }, { status: 404 });
    }

    await prisma.notification.createMany({
      data: recipients.map((recipient) => ({
        userId: recipient.id,
        title,
        message,
        type: "ADMIN",
        link: getRecipientNotificationLink(recipient.role, link),
      })),
    });

    const recipientReport = buildBroadcastRecipientReport(recipients);

    let emailed = 0;
    if (body.sendEmail && hasConfiguredMailTransport()) {
      for (const recipient of recipients) {
        const recipientLink = getRecipientNotificationLink(recipient.role, link);
        const emailResult = await sendMail({
          to: recipient.email,
          subject: title,
          text: message,
          html: `
            <div style="font-family: Arial, sans-serif; color: #282C3F;">
              <h2>${escapeHtml(title)}</h2>
              <p>Hello ${escapeHtml(recipient.name || "there")},</p>
              <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
              <p style="margin-top: 16px;">
                <a href="${buildAbsoluteAppUrl(recipientLink)}" style="display:inline-block;background:#ff3f6c;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;">
                  Open Fit Bazar
                </a>
              </p>
            </div>
          `,
        });

        if (emailResult.delivered) {
          emailed += 1;
          const report = recipientReport.find((item) => item.id === recipient.id);
          if (report) report.emailSent = true;
        }
      }
    }

    return NextResponse.json({
      success: true,
      notified: recipients.length,
      emailed,
      recipients: recipientReport,
      privacy: "Emails are sent one recipient at a time. Customers and vendors cannot see the other recipients.",
    });
  } catch (error) {
    console.error("Error broadcasting admin notification:", error);
    return NextResponse.json({ error: "Failed to send notification." }, { status: 500 });
  }
}
