export type CanonicalOrderItem = {
  productId: string;
  vendorId: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
};

export function groupItemsByVendor(items: CanonicalOrderItem[]) {
  return items.reduce((acc, item) => {
    if (!acc[item.vendorId]) {
      acc[item.vendorId] = [];
    }
    acc[item.vendorId].push(item);
    return acc;
  }, {} as Record<string, CanonicalOrderItem[]>);
}

export function calculateOrderAmounts(input: {
  items: CanonicalOrderItem[];
  commissionPct: number;
  couponDiscountPct?: number;
  couponDiscountAmount?: number;
  shippingAmount?: number;
}) {
  const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const couponDiscount = input.couponDiscountAmount ?? (input.couponDiscountPct ? subtotal * (input.couponDiscountPct / 100) : 0);
  const shippingAmount = input.shippingAmount ?? 0;
  const totalAmount = subtotal - couponDiscount + shippingAmount;
  const commissionAmt = subtotal * (input.commissionPct / 100);
  const vendorPayout = totalAmount - commissionAmt;

  return {
    subtotal,
    couponDiscount,
    shippingAmount,
    totalAmount,
    commissionAmt,
    vendorPayout,
  };
}

export function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function allocateAmountAcrossSubtotals(totalAmount: number, subtotals: number[]) {
  if (!subtotals.length) {
    return [];
  }

  const totalSubtotal = subtotals.reduce((sum, subtotal) => sum + subtotal, 0);

  if (totalSubtotal <= 0) {
    const baseShare = roundCurrency(totalAmount / subtotals.length);
    const allocations = subtotals.map(() => baseShare);
    const remainder = roundCurrency(totalAmount - allocations.reduce((sum, value) => sum + value, 0));
    allocations[allocations.length - 1] = roundCurrency(allocations[allocations.length - 1] + remainder);
    return allocations;
  }

  const allocations = subtotals.map((subtotal, index) => {
    if (index === subtotals.length - 1) {
      return 0;
    }

    return roundCurrency((subtotal / totalSubtotal) * totalAmount);
  });
  const allocatedBeforeLast = allocations.reduce((sum, value) => sum + value, 0);
  allocations[allocations.length - 1] = roundCurrency(totalAmount - allocatedBeforeLast);

  return allocations;
}
