import test from "node:test";
import assert from "node:assert/strict";
import { calculateOrderAmounts, groupItemsByVendor } from "../src/lib/order-routing";

test("order routing groups cart items by actual vendor", () => {
  const grouped = groupItemsByVendor([
    { productId: "p1", vendorId: "v1", price: 1000, quantity: 1 },
    { productId: "p2", vendorId: "v2", price: 1500, quantity: 2 },
    { productId: "p3", vendorId: "v1", price: 800, quantity: 1 },
  ]);

  assert.equal(grouped.v1.length, 2);
  assert.equal(grouped.v2.length, 1);
});

test("order amount calculation keeps commission and coupon math stable", () => {
  const amounts = calculateOrderAmounts({
    items: [
      { productId: "p1", vendorId: "v1", price: 1000, quantity: 1 },
      { productId: "p2", vendorId: "v1", price: 500, quantity: 2 },
    ],
    commissionPct: 8,
    couponDiscountPct: 10,
  });

  assert.equal(amounts.subtotal, 2000);
  assert.equal(amounts.couponDiscount, 200);
  assert.equal(amounts.totalAmount, 1800);
  assert.equal(amounts.commissionAmt, 160);
  assert.equal(amounts.vendorPayout, 1640);
});
