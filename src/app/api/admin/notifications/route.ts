import { NextResponse } from "next/server";
import { buildAbsoluteAppUrl } from "@/lib/app-url";
import { hasConfiguredMailTransport, sendMail } from "@/lib/mailer";
import { getSafeHref } from "@/lib/media";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

type BroadcastAudience = "CUSTOMERS" | "VENDORS" | "ALL";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeAudience(value?: string): BroadcastAudience {
  if (value === "VENDORS" || value === "ALL") return value;
  return "CUSTOMERS";
}

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

    const title = body.title?.trim();
    const message = body.message?.trim();
    const audience = normalizeAudience(body.audience);
    const requestedLink = body.link?.trim();
    const link =
      requestedLink && requestedLink.startsWith("/") && !requestedLink.startsWith("//")
        ? getSafeHref(requestedLink, "/account/notifications")
        : "/account/notifications";

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
    }

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
        link: recipient.role === "VENDOR" && link === "/account/notifications" ? "/vendor/dashboard" : link,
      })),
    });

    let emailed = 0;
    if (body.sendEmail && hasConfiguredMailTransport()) {
      const emailResult = await sendMail({
        to: recipients.map((recipient) => recipient.email),
        subject: title,
        text: message,
        html: `
          <div style="font-family: Arial, sans-serif; color: #282C3F;">
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
            <p style="margin-top: 16px;">
              <a href="${buildAbsoluteAppUrl(link)}" style="display:inline-block;background:#ff3f6c;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;">
                Open Fit Bazar
              </a>
            </p>
          </div>
        `,
      });

      if (emailResult.delivered) {
        emailed = recipients.length;
      }
    }

    return NextResponse.json({
      success: true,
      notified: recipients.length,
      emailed,
    });
  } catch (error) {
    console.error("Error broadcasting admin notification:", error);
    return NextResponse.json({ error: "Failed to send notification." }, { status: 500 });
  }
}
