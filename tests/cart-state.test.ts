import assert from "node:assert/strict";
import { mergeCartCollections, mergeWishlistCollections } from "../src/lib/cart-state";

export function runCartStateTests(run: (name: string, fn: () => void) => void) {
  run("cart merge keeps variants separate and merges same variant quantities", () => {
    const merged = mergeCartCollections(
      [
        {
          id: "c1",
          productId: "p1",
          name: "Kurta",
          price: 1000,
          image: "a.jpg",
          quantity: 1,
          size: "M",
        },
      ],
      [
        {
          id: "c2",
          productId: "p1",
          name: "Kurta",
          price: 1000,
          image: "a.jpg",
          quantity: 2,
          size: "M",
        },
        {
          id: "c3",
          productId: "p1",
          name: "Kurta",
          price: 1000,
          image: "a.jpg",
          quantity: 1,
          size: "L",
        },
      ],
    );

    assert.equal(merged.length, 2);
    assert.equal(merged.find((item) => item.size === "M")?.quantity, 3);
    assert.equal(merged.find((item) => item.size === "L")?.quantity, 1);
  });

  run("wishlist merge avoids duplicate products", () => {
    const merged = mergeWishlistCollections(
      [
        {
          id: "w1",
          productId: "p1",
          name: "Saree",
          price: 2500,
          image: "a.jpg",
          vendorName: "Shop A",
        },
      ],
      [
        {
          id: "w2",
          productId: "p1",
          name: "Saree",
          price: 2500,
          image: "a.jpg",
          vendorName: "Shop A",
        },
        {
          id: "w3",
          productId: "p2",
          name: "Shirt",
          price: 1500,
          image: "b.jpg",
          vendorName: "Shop B",
        },
      ],
    );

    assert.equal(merged.length, 2);
    assert.deepEqual(
      merged.map((item) => item.productId),
      ["p1", "p2"],
    );
  });
}
