import { DeliveryAssignmentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  canTransitionDeliveryStatus,
  deliveryTimestampUpdate,
  mapDeliveryStatusToOrderStatus,
  notifyDeliveryStatus,
} from "@/lib/delivery";
import { requireMobileDelivery } from "@/lib/mobile-api-auth";
import { MobileAuthError } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireMobileDelivery(request);
    const { id } = await params;

    const body = (await request.json()) as {
      status?: string;
      note?: string;
      failureReason?: string;
      proofImageUrl?: string;
      location?: unknown;
    };
    const nextStatus = body.status as DeliveryAssignmentStatus | undefined;

    if (!nextStatus || !Object.values(DeliveryAssignmentStatus).includes(nextStatus)) {
      return NextResponse.json({ error: "Invalid delivery status." }, { status: 400 });
    }

    const current = await prisma.deliveryAssignment.findFirst({
      where: {
        id,
        partnerId: auth.user.deliveryPartnerId,
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerId: true,
            vendor: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!current) {
      return NextResponse.json({ error: "Delivery assignment not found." }, { status: 404 });
    }

    if (!canTransitionDeliveryStatus(current.status, nextStatus)) {
      return NextResponse.json({ error: "Delivery status transition is not allowed." }, { status: 400 });
    }

    const orderStatus = mapDeliveryStatusToOrderStatus(nextStatus);
    const updated = await prisma.$transaction(async (tx) => {
      const assignment = await tx.deliveryAssignment.update({
        where: { id: current.id },
        data: {
          status: nextStatus,
          failureReason: nextStatus === DeliveryAssignmentStatus.FAILED ? body.failureReason?.trim() || null : current.failureReason,
          proofImageUrl: body.proofImageUrl?.trim() || current.proofImageUrl,
          ...deliveryTimestampUpdate(nextStatus),
        },
      });

      await tx.deliveryStatusEvent.create({
        data: {
          assignmentId: current.id,
          actorUserId: auth.user.id,
          status: nextStatus,
          note: body.note?.trim() || null,
          location: body.location as never,
        },
      });

      if (orderStatus) {
        await tx.order.update({
          where: { id: current.order.id },
          data: { status: orderStatus },
        });
      }

      if (nextStatus === DeliveryAssignmentStatus.DELIVERED) {
        await tx.deliveryEarning.updateMany({
          where: {
            assignmentId: current.id,
            status: "PENDING",
          },
          data: {
            status: "RELEASED",
            releasedAt: new Date(),
          },
        });
      }

      return assignment;
    });

    await notifyDeliveryStatus({
      orderId: current.order.id,
      orderNumber: current.order.orderNumber,
      customerId: current.order.customerId,
      vendorUserId: current.order.vendor.userId,
      status: nextStatus,
    });

    return NextResponse.json({ assignment: updated });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Error updating delivery status:", error);
    return NextResponse.json({ error: "Failed to update delivery status." }, { status: 500 });
  }
}
