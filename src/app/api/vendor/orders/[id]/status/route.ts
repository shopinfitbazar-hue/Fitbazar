import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendorSession } from "@/lib/server-auth";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const vendorStatusTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING: ["RECEIVED"],
  RECEIVED: ["PACKED"],
  PACKED: ["HANDED_TO_DELIVERY"],
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireVendorSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const { vendor } = auth;
    const { id } = await params;
    const body = (await request.json()) as { status?: OrderStatus };

    if (!body.status || !Object.values(OrderStatus).includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: {
        id,
        vendorId: vendor.id,
      },
      select: {
        id: true,
        customerId: true,
        orderNumber: true,
        status: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const allowedNextStatuses = vendorStatusTransitions[order.status] || [];
    if (!allowedNextStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: "This status can only be changed by an admin." },
        { status: 403 },
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: body.status },
    });

    await prisma.notification.create({
      data: {
        userId: order.customerId,
        title: "Order status updated",
        message: `Your order ${order.orderNumber} is now ${body.status.replaceAll("_", " ")}.`,
        type: "ORDER",
        link: "/account/orders",
      },
    }).catch(() => undefined);

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error("Error updating vendor order status:", error);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}
