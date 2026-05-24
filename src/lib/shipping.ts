export const DELIVERY_OPTIONS = {
  standard: {
    id: "standard",
    price: 100,
  },
  express: {
    id: "express",
    price: 250,
  },
  pickup: {
    id: "pickup",
    price: 0,
  },
} as const;

export type DeliveryMethod = keyof typeof DELIVERY_OPTIONS;

export function isDeliveryMethod(value: string): value is DeliveryMethod {
  return value in DELIVERY_OPTIONS;
}

export function getShippingAmount(input: {
  subtotal: number;
  deliveryMethod: string;
  freeDeliveryThreshold?: number;
}) {
  const freeDeliveryThreshold = input.freeDeliveryThreshold ?? 2000;
  const method = isDeliveryMethod(input.deliveryMethod) ? input.deliveryMethod : "standard";
  const option = DELIVERY_OPTIONS[method];

  if (method !== "pickup" && input.subtotal >= freeDeliveryThreshold) {
    return 0;
  }

  return option.price;
}
