import { DeliveryAssignmentStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireMobileDelivery } from "@/lib/mobile-api-auth";
import { MobileAuthError } from "@/lib/mobile-auth";
import { buildPaginationMeta, getPagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireMobileDelivery(request);

    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip, take } = getPagination(searchParams, {
      defaultPageSize: 25,
      maxPageSize: 100,
    });
    const status = searchParams.get("status");
    const activeOnly = searchParams.get("activeOnly") !== "false";
    const where: Prisma.DeliveryAssignmentWhereInput = {
      partnerId: auth.user.deliveryPartnerId,
      ...(status && Object.values(DeliveryAssignmentStatus).includes(status as DeliveryAssignmentStatus)
        ? { status: status as DeliveryAssignmentStatus }
        : activeOnly
          ? {
              status: {
                in: [
                  DeliveryAssignmentStatus.ASSIGNED,
                  DeliveryAssignmentStatus.PICKUP_CONFIRMED,
                  DeliveryAssignmentStatus.IN_TRANSIT,
                ],
              },
            }
          : {}),
    };

    const [assignments, total] = await Promise.all([
      prisma.deliveryAssignment.findMany({
        where,
        include: {
          order: {
            include: {
              vendor: {
                select: {
                  shopName: true,
                  phone: true,
                  address: true,
                  zone: true,
                  district: true,
                },
              },
              customer: {
                select: {
                  name: true,
                  phone: true,
                },
              },
              items: {
                include: {
                  product: {
                    select: {
                      name: true,
                      images: true,
                    },
                  },
                },
              },
            },
          },
          earning: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.deliveryAssignment.count({ where }),
    ]);

    return NextResponse.json({
      assignments,
      pagination: buildPaginationMeta(total, page, pageSize),
    });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Error fetching mobile delivery assignments:", error);
    return NextResponse.json({ error: "Failed to fetch delivery assignments." }, { status: 500 });
  }
}
