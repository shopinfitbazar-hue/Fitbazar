import test from "node:test";
import assert from "node:assert/strict";
import { categoryQueryValue, normalizeCategory } from "../src/lib/categories";

test("navbar category aliases normalize to canonical database values", () => {
  assert.equal(normalizeCategory("men"), "Men");
  assert.equal(normalizeCategory("sports"), "Sportswear");
  assert.equal(normalizeCategory("ethnic"), "Ethnic Wear");
});

test("category query values stay launch-safe for direct links", () => {
  assert.equal(categoryQueryValue("Men"), "Men");
  assert.equal(categoryQueryValue("sports"), "Sportswear");
});
