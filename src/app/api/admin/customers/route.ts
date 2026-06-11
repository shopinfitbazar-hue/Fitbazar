import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildPaginationMeta, getAdminPagination, getAdminSearch } from "@/lib/admin-pagination";
import { requireAdminSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireAdminSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = getAdminSearch(searchParams);
    const { page, pageSize, skip, take } = getAdminPagination(searchParams);
    const where = {
      role: "CUSTOMER" as const,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
              { phone: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          emailVerified: true,
          isBanned: true,
          createdAt: true,
          accounts: {
            select: {
              provider: true,
            },
          },
          _count: {
            select: {
              orders: true,
              wishlist: true,
              supportTickets: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      customers,
      pagination: buildPaginationMeta(total, page, pageSize),
    });
  } catch (error) {
    console.error("Error fetching admin customers:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}
