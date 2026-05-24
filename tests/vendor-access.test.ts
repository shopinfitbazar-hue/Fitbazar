import test from "node:test";
import assert from "node:assert/strict";
import { getVendorAccessState } from "../src/lib/vendor-access";

test("approved vendors can operate", () => {
  assert.deepEqual(getVendorAccessState({ isApproved: true, isSuspended: false }), {
    canOperate: true,
    reason: null,
  });
});

test("pending and suspended vendors are blocked correctly", () => {
  assert.equal(getVendorAccessState({ isApproved: false, isSuspended: false }).reason, "Vendor pending approval");
  assert.equal(getVendorAccessState({ isApproved: true, isSuspended: true }).reason, "Vendor suspended");
});
