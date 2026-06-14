import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function clean(value: unknown, maxLength: number) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; name?: string };
    const email = clean(body.email, 160).toLowerCase();
    const name = clean(body.name, 80) || "Launch subscriber";
    const topic = "Launching Soon - India Delivery";

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const recentWindow = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await prisma.supportTicket.findFirst({
      where: {
        email,
        topic,
        createdAt: {
          gte: recentWindow,
        },
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "You are already on today's launch list.",
      });
    }

    await prisma.supportTicket.create({
      data: {
        name,
        email,
        topic,
        message: "Please notify me when Fit Bazar India to Nepal delivery launches.",
        status: "OPEN",
        messages: {
          create: {
            sender: "CUSTOMER",
            message: "Please notify me when Fit Bazar India to Nepal delivery launches.",
          },
        },
      },
    });

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
      take: 25,
    });

    if (admins.length) {
      await prisma.notification
        .createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            title: "Launch notify request",
            message: `${name} (${email}) wants India to Nepal delivery launch updates.`,
            type: "SUPPORT",
            link: "/admin#support",
          })),
        })
        .catch(() => undefined);
    }

    return NextResponse.json({
      success: true,
      message: "You are on the launch list. We will notify you first.",
    });
  } catch (error) {
    console.error("Launch notify error:", error);
    return NextResponse.json({ error: "Unable to save your request." }, { status: 500 });
  }
}
