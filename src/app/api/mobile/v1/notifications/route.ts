import { NextResponse } from "next/server";
import { getBearerToken, loadMobileSession, MobileAuthError } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await loadMobileSession(getBearerToken(request.headers));
    const notifications = await prisma.notification.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Error fetching mobile notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await loadMobileSession(getBearerToken(request.headers));
    await prisma.notification.updateMany({
      where: {
        userId: auth.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Error updating mobile notifications:", error);
    return NextResponse.json({ error: "Failed to update notifications." }, { status: 500 });
  }
}
