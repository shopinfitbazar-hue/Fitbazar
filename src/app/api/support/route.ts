import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/server-auth";
import { hasConfiguredMailTransport, sendMail } from "@/lib/mailer";
import { buildSupportMessages } from "@/lib/support";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireUserSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const tickets = await prisma.supportTicket.findMany({
      where: { userId: auth.session.user.id },
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
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      tickets: tickets.map((ticket) => ({
        ...ticket,
        messages: buildSupportMessages(ticket),
      })),
    });
  } catch (error) {
    console.error("Support fetch error:", error);
    return NextResponse.json({ error: "Unable to fetch support history." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      topic?: string;
      orderNumber?: string;
      message?: string;
    };

    const auth = await requireUserSession();
    const sessionUser = "error" in auth ? null : auth.session.user;

    const name = body.name?.trim() || sessionUser?.name || "";
    const email = body.email?.trim().toLowerCase() || sessionUser?.email || "";
    const topic = body.topic?.trim() || "General Support";
    const orderNumber = body.orderNumber?.trim();
    const message = body.message?.trim();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: sessionUser?.id || null,
        name,
        email,
        topic,
        orderNumber: orderNumber || null,
        message,
        status: "OPEN",
        messages: {
          create: {
            userId: sessionUser?.id || null,
            sender: "CUSTOMER",
            message,
          },
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const admins = await prisma.user.findMany({
      where: {
        role: "ADMIN",
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (admins.length) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: `Support: ${topic}`,
          message: `${name} (${email})${orderNumber ? ` • Order ${orderNumber}` : ""}: ${message}`,
          type: "SUPPORT",
          link: "/admin#support",
        })),
      }).catch(() => undefined);
    }

    const adminEmails = admins.map((admin) => admin.email).filter(Boolean);
    if (adminEmails.length && hasConfiguredMailTransport()) {
      await sendMail({
        to: adminEmails,
        subject: `Fit Bazar support request: ${topic}`,
        text: `${name} (${email})${orderNumber ? ` • Order ${orderNumber}` : ""}\n\n${message}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #282C3F;">
            <h2>Fit Bazar support request</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Topic:</strong> ${topic}</p>
            ${orderNumber ? `<p><strong>Order:</strong> ${orderNumber}</p>` : ""}
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, "<br />")}</p>
          </div>
        `,
      }).catch(() => undefined);
    }

    return NextResponse.json({
      success: true,
      ticket: {
        ...ticket,
        messages: buildSupportMessages(ticket),
      },
      message: "Your support request has been received.",
    });
  } catch (error) {
    console.error("Support request error:", error);
    return NextResponse.json({ error: "Unable to submit support request." }, { status: 500 });
  }
}
