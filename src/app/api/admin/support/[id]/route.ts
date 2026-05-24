import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/server-auth";
import { hasConfiguredMailTransport, sendMail } from "@/lib/mailer";
import { buildSupportMessages, normalizeSupportStatus } from "@/lib/support";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const { id } = await params;
    const body = (await request.json()) as {
      status?: string;
      adminResponse?: string;
      replyMessage?: string;
    };

    const nextStatus = normalizeSupportStatus(body.status) ?? undefined;
    if (body.status && !nextStatus) {
      return NextResponse.json({ error: "Invalid support status." }, { status: 400 });
    }

    const replyMessage = body.replyMessage?.trim();
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
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

    if (!ticket) {
      return NextResponse.json({ error: "Support ticket not found." }, { status: 404 });
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id },
      data: {
        ...(nextStatus ? { status: nextStatus } : {}),
        ...(body.adminResponse !== undefined ? { adminResponse: body.adminResponse.trim() || null } : {}),
        ...(nextStatus === "RESOLVED" ? { resolvedAt: new Date() } : nextStatus ? { resolvedAt: null } : {}),
        ...(replyMessage
          ? {
              messages: {
                create: {
                  sender: "ADMIN",
                  message: replyMessage,
                },
              },
              adminResponse: replyMessage,
            }
          : {}),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
        messages: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (replyMessage && ticket.user?.id) {
      await prisma.notification.create({
        data: {
          userId: ticket.user.id,
          title: `Support reply: ${ticket.topic}`,
          message: replyMessage,
          type: "SUPPORT",
          link: "/account/support",
        },
      }).catch(() => undefined);
    }

    if (replyMessage && hasConfiguredMailTransport()) {
      await sendMail({
        to: ticket.email,
        subject: `Fit Bazar support update: ${ticket.topic}`,
        text: `Hello ${ticket.name},\n\n${replyMessage}\n\nYou can view your support history in your account.`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #282C3F;">
            <h2>Fit Bazar support reply</h2>
            <p>Hello ${ticket.name},</p>
            <p>${replyMessage.replace(/\n/g, "<br />")}</p>
            <p style="margin-top: 16px;">
              <a href="${process.env.NEXTAUTH_URL || ""}/account/support" style="display:inline-block;background:#ff3f6c;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;">
                View Support Ticket
              </a>
            </p>
          </div>
        `,
      }).catch(() => undefined);
    }

    return NextResponse.json({
      ticket: {
        ...updatedTicket,
        messages: buildSupportMessages(updatedTicket),
      },
    });
  } catch (error) {
    console.error("Error updating support ticket:", error);
    return NextResponse.json({ error: "Failed to update support ticket" }, { status: 500 });
  }
}
