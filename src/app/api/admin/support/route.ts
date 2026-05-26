import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/server-auth";
import { buildSupportMessages } from "@/lib/support";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireAdminSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get("includeArchived") === "1";
    const archiveBefore = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const archivedWhere = {
      status: { in: ["RESOLVED", "CLOSED"] },
      resolvedAt: { lt: archiveBefore },
    };

    const tickets = await prisma.supportTicket.findMany({
      where: includeArchived
        ? undefined
        : {
            NOT: archivedWhere,
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
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    const archivedCount = await prisma.supportTicket.count({
      where: archivedWhere,
    });

    return NextResponse.json({
      archivedCount,
      tickets: tickets.map((ticket) => ({
        ...ticket,
        messages: buildSupportMessages(ticket),
      })),
    });
  } catch (error) {
    console.error("Error fetching support tickets:", error);
    return NextResponse.json({ error: "Failed to fetch support tickets" }, { status: 500 });
  }
}
