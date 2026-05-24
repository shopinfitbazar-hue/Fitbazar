import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/server-auth";
import { hasConfiguredMailTransport, sendMail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUserSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as { message?: string };
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id,
        userId: auth.session.user.id,
      },
      select: {
        id: true,
        topic: true,
        name: true,
        email: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Support ticket not found." }, { status: 404 });
    }

    const reply = await prisma.supportMessage.create({
      data: {
        ticketId: id,
        userId: auth.session.user.id,
        sender: "CUSTOMER",
        message,
      },
    });

    await prisma.supportTicket.update({
      where: { id },
      data: {
        status: "OPEN",
        adminResponse: null,
        resolvedAt: null,
      },
    });

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, email: true },
    });

    if (admins.length) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: `Support follow-up: ${ticket.topic}`,
          message: `${ticket.name} sent a follow-up reply.`,
          type: "SUPPORT",
          link: "/admin#support",
        })),
      }).catch(() => undefined);
    }

    const adminEmails = admins.map((admin) => admin.email).filter(Boolean);
    if (adminEmails.length && hasConfiguredMailTransport()) {
      await sendMail({
        to: adminEmails.join(", "),
        subject: `Fit Bazar support follow-up: ${ticket.topic}`,
        text: `${ticket.name} (${ticket.email}) sent a follow-up:\n\n${message}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #282C3F;">
            <h2>Support follow-up</h2>
            <p><strong>${ticket.name}</strong> (${ticket.email}) sent a follow-up on <strong>${ticket.topic}</strong>.</p>
            <p>${message.replace(/\n/g, "<br />")}</p>
          </div>
        `,
      }).catch(() => undefined);
    }

    return NextResponse.json({ reply }, { status: 201 });
  } catch (error) {
    console.error("Error creating support reply:", error);
    return NextResponse.json({ error: "Failed to send support reply." }, { status: 500 });
  }
}
