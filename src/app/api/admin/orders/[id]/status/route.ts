import { OrderStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const allowedStatuses = Object.values(OrderStatus);

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdminSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const body = (await request.json()) as { status?: OrderStatus };

    if (!body.status || !allowedStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        customerId: true,
        orderNumber: true,
        vendor: {
          select: {
            userId: true,
            shopName: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: { status: body.status },
    });

    const readableStatus = body.status.replaceAll("_", " ");
    await prisma.notification.createMany({
      data: [
        {
          userId: order.customerId,
          title: "Order status updated",
          message: `Your order ${order.orderNumber} is now ${readableStatus}.`,
          type: "ORDER",
          link: "/account/orders",
        },
        {
          userId: order.vendor.userId,
          title: "Order status updated by admin",
          message: `Order ${order.orderNumber} for ${order.vendor.shopName} is now ${readableStatus}.`,
          type: "ORDER",
          link: "/vendor/orders",
        },
      ],
    }).catch(() => undefined);

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error("Error updating admin order status:", error);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}
