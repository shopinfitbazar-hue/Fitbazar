import crypto from "node:crypto";
import { DeliveryAssignmentStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { buildPaginationMeta, getPagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function authStatus(error: string) {
  return error === "Unauthorized" ? 401 : 403;
}

function buildDeliveryCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdminSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: authStatus(auth.error) });
    }

    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip, take } = getPagination(searchParams, {
      defaultPageSize: 25,
      maxPageSize: 100,
    });
    const status = searchParams.get("status");
    const q = (searchParams.get("q") || "").trim().slice(0, 120);
    const where: Prisma.DeliveryAssignmentWhereInput = {
      ...(status && Object.values(DeliveryAssignmentStatus).includes(status as DeliveryAssignmentStatus)
        ? { status: status as DeliveryAssignmentStatus }
        : {}),
      ...(q
        ? {
            OR: [
              { order: { orderNumber: { contains: q, mode: "insensitive" } } },
              { order: { customer: { name: { contains: q, mode: "insensitive" } } } },
              { partner: { user: { name: { contains: q, mode: "insensitive" } } } },
              { partner: { phone: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [assignments, total, partners] = await Promise.all([
      prisma.deliveryAssignment.findMany({
        where,
        include: {
          partner: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          order: {
            include: {
              customer: {
                select: {
                  name: true,
                  email: true,
                  phone: true,
                },
              },
              vendor: {
                select: {
                  shopName: true,
                  userId: true,
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
      prisma.deliveryPartner.findMany({
        where: {
          isActive: true,
          isSuspended: false,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    return NextResponse.json({
      assignments,
      partners,
      pagination: buildPaginationMeta(total, page, pageSize),
    });
  } catch (error) {
    console.error("Error fetching delivery assignments:", error);
    return NextResponse.json({ error: "Failed to fetch delivery assignments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdminSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: authStatus(auth.error) });
    }

    const body = (await request.json()) as {
      orderId?: string;
      partnerId?: string;
      routeNote?: string;
      customerContact?: string;
      earningAmount?: number;
    };

    if (!body.orderId) {
      return NextResponse.json({ error: "orderId is required." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: body.orderId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (body.partnerId) {
      const partner = await prisma.deliveryPartner.findFirst({
        where: {
          id: body.partnerId,
          isActive: true,
          isSuspended: false,
        },
        select: { id: true },
      });

      if (!partner) {
        return NextResponse.json({ error: "Delivery partner is not active." }, { status: 400 });
      }
    }

    const assignment = await prisma.$transaction(async (tx) => {
      const saved = await tx.deliveryAssignment.upsert({
        where: { orderId: body.orderId as string },
        create: {
          orderId: body.orderId as string,
          partnerId: body.partnerId || null,
          status: DeliveryAssignmentStatus.ASSIGNED,
          pickupCode: buildDeliveryCode(),
          deliveryCode: buildDeliveryCode(),
          routeNote: body.routeNote?.trim() || null,
          customerContact: body.customerContact?.trim() || null,
        },
        update: {
          partnerId: body.partnerId || null,
          status: DeliveryAssignmentStatus.ASSIGNED,
          routeNote: body.routeNote?.trim() || null,
          customerContact: body.customerContact?.trim() || null,
        },
      });

      await tx.deliveryStatusEvent.create({
        data: {
          assignmentId: saved.id,
          actorUserId: auth.session.user.id,
          status: DeliveryAssignmentStatus.ASSIGNED,
          note: "Delivery assigned by admin.",
        },
      });

      if (body.partnerId && Number(body.earningAmount || 0) > 0) {
        await tx.deliveryEarning.upsert({
          where: { assignmentId: saved.id },
          create: {
            assignmentId: saved.id,
            partnerId: body.partnerId,
            amount: Number(body.earningAmount),
          },
          update: {
            partnerId: body.partnerId,
            amount: Number(body.earningAmount),
            status: "PENDING",
            releasedAt: null,
          },
        });
      }

      if (order.status !== "DELIVERED" && order.status !== "CANCELLED") {
        await tx.order.update({
          where: { id: body.orderId as string },
          data: {
            status: "HANDED_TO_DELIVERY",
          },
        });
      }

      return saved;
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error("Error assigning delivery:", error);
    return NextResponse.json({ error: "Failed to assign delivery" }, { status: 500 });
  }
}
