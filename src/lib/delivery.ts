import { DeliveryAssignmentStatus, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const DELIVERY_STATUS_TRANSITIONS: Partial<Record<DeliveryAssignmentStatus, DeliveryAssignmentStatus[]>> = {
  ASSIGNED: [DeliveryAssignmentStatus.PICKUP_CONFIRMED, DeliveryAssignmentStatus.FAILED, DeliveryAssignmentStatus.CANCELLED],
  PICKUP_CONFIRMED: [DeliveryAssignmentStatus.IN_TRANSIT, DeliveryAssignmentStatus.FAILED],
  IN_TRANSIT: [DeliveryAssignmentStatus.DELIVERED, DeliveryAssignmentStatus.FAILED],
  FAILED: [DeliveryAssignmentStatus.ASSIGNED, DeliveryAssignmentStatus.CANCELLED],
};

export function canTransitionDeliveryStatus(current: DeliveryAssignmentStatus, next: DeliveryAssignmentStatus) {
  return (DELIVERY_STATUS_TRANSITIONS[current] || []).includes(next);
}

export function mapDeliveryStatusToOrderStatus(status: DeliveryAssignmentStatus): OrderStatus | null {
  if (status === DeliveryAssignmentStatus.PICKUP_CONFIRMED || status === DeliveryAssignmentStatus.IN_TRANSIT) {
    return OrderStatus.HANDED_TO_DELIVERY;
  }

  if (status === DeliveryAssignmentStatus.DELIVERED) {
    return OrderStatus.DELIVERED;
  }

  if (status === DeliveryAssignmentStatus.CANCELLED) {
    return OrderStatus.CANCELLED;
  }

  return null;
}

export function deliveryTimestampUpdate(status: DeliveryAssignmentStatus) {
  if (status === DeliveryAssignmentStatus.PICKUP_CONFIRMED) return { pickupAt: new Date() };
  if (status === DeliveryAssignmentStatus.IN_TRANSIT) return { inTransitAt: new Date() };
  if (status === DeliveryAssignmentStatus.DELIVERED) return { deliveredAt: new Date() };
  if (status === DeliveryAssignmentStatus.FAILED) return { failedAt: new Date() };
  return {};
}

export async function notifyDeliveryStatus(input: {
  orderId: string;
  orderNumber: string;
  customerId: string;
  vendorUserId: string;
  status: DeliveryAssignmentStatus;
}) {
  const readableStatus = input.status.replaceAll("_", " ");

  await prisma.notification.createMany({
    data: [
      {
        userId: input.customerId,
        title: "Delivery status updated",
        message: `Your order ${input.orderNumber} is now ${readableStatus}.`,
        type: "DELIVERY",
        link: "/account/orders",
      },
      {
        userId: input.vendorUserId,
        title: "Delivery status updated",
        message: `Order ${input.orderNumber} is now ${readableStatus}.`,
        type: "DELIVERY",
        link: "/vendor/orders",
      },
    ],
  }).catch(() => undefined);
}
