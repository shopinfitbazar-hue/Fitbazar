import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildPaginationMeta, getAdminPagination, getAdminSearch } from "@/lib/admin-pagination";
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
    const q = getAdminSearch(searchParams);
    const { page, pageSize, skip, take } = getAdminPagination(searchParams);
    const archiveBefore = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const archivedWhere = {
      status: { in: ["RESOLVED", "CLOSED"] },
      resolvedAt: { lt: archiveBefore },
    };
    const searchWhere = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { topic: { contains: q, mode: "insensitive" as const } },
            { orderNumber: { contains: q, mode: "insensitive" as const } },
            { message: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};
    const where = {
      ...searchWhere,
      ...(includeArchived
        ? {}
        : {
            NOT: archivedWhere,
          }),
    };

    const [tickets, total, archivedCount] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
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
        skip,
        take,
      }),
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.count({
        where: archivedWhere,
      }),
    ]);

    return NextResponse.json({
      archivedCount,
      pagination: buildPaginationMeta(total, page, pageSize),
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
