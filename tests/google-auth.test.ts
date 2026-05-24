import test from "node:test";
import assert from "node:assert/strict";
import { hasConfiguredGoogleOAuth } from "../src/lib/google-auth";

test("google oauth helper rejects placeholder credentials", () => {
  assert.equal(
    hasConfiguredGoogleOAuth({ clientId: "your-google-client-id", clientSecret: "your-google-client-secret" }),
    false,
  );
});

test("google oauth helper accepts configured credentials", () => {
  assert.equal(
    hasConfiguredGoogleOAuth({ clientId: "real-client-id.apps.googleusercontent.com", clientSecret: "real-secret" }),
    true,
  );
});
