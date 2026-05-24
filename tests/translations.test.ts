import test from "node:test";
import assert from "node:assert/strict";
import { t } from "../src/lib/translations";

test("translations fall back to English for unknown language key coverage", () => {
  assert.equal(t("home", "ne"), "गृहपृष्ठ");
  assert.equal(t("non_existent_key", "en"), "non_existent_key");
});
