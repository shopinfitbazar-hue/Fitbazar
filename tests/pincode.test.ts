import test from "node:test";
import assert from "node:assert/strict";
import { getDeliveryMessage, isValidNepalPincode, resolvePincode } from "../src/lib/pincode";

test("valid Nepal pincodes pass validation", () => {
  assert.equal(isValidNepalPincode("44600"), true);
  assert.equal(isValidNepalPincode("1234"), false);
});

test("delivery messaging resolves known districts", () => {
  const result = getDeliveryMessage("44600", new Date("2026-03-20T00:00:00Z"));
  assert.equal(result.ok, true);
  assert.match(result.message, /Kathmandu/);
});

test("non-Kathmandu pincodes are not serviceable yet", () => {
  const result = resolvePincode("44900");
  assert.equal(result?.district, "Other Nepal");
  assert.equal(result?.zone, "Other Nepal");
  assert.equal(result?.serviceable, false);
});
