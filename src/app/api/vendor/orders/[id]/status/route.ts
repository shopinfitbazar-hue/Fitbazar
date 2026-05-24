import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendorSession } from "@/lib/server-auth";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const allowedStatuses: OrderStatus[] = ["PENDING", "RECEIVED", "PACKED", "HANDED_TO_DELIVERY", "DELIVERED", "CANCELLED", "DISPUTED"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireVendorSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const { vendor } = auth;
    const { id } = await params;
    const body = (await request.json()) as { status?: OrderStatus };

    if (!body.status || !allowedStatuses.includes(body.status)) {
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
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
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
