import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileCustomer } from "@/lib/mobile-api-auth";
import { MobileAuthError } from "@/lib/mobile-auth";
import { buildSupportMessages } from "@/lib/support";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireMobileCustomer(request);
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: auth.user.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ tickets: tickets.map((ticket) => ({ ...ticket, messages: buildSupportMessages(ticket) })) });
  } catch (error) {
    if (error instanceof MobileAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Unable to load support history." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireMobileCustomer(request);
    const body = await request.json().catch(() => ({}));
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const topic = typeof body.topic === "string" && body.topic.trim() ? body.topic.trim().slice(0, 120) : "General Support";
    const orderNumber = typeof body.orderNumber === "string" ? body.orderNumber.trim().slice(0, 80) : "";
    if (!message) return NextResponse.json({ error: "Please enter your support message." }, { status: 400 });

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: auth.user.id,
        name: auth.user.name || "FitBazar Customer",
        email: auth.user.email,
        topic,
        orderNumber: orderNumber || null,
        message: message.slice(0, 4_000),
        status: "OPEN",
        messages: { create: { userId: auth.user.id, sender: "CUSTOMER", message: message.slice(0, 4_000) } },
      },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    if (admins.length) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: `Support: ${topic}`,
          message: `${auth.user.name || auth.user.email}: ${message.slice(0, 300)}`,
          type: "SUPPORT",
          link: "/admin#support",
        })),
      }).catch(() => undefined);
    }

    return NextResponse.json({
      success: true,
      ticket: { ...ticket, messages: buildSupportMessages(ticket) },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof MobileAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Unable to submit support request." }, { status: 500 });
  }
}
