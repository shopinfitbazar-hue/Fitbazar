import crypto from "node:crypto";
import { buildAbsoluteAppUrl } from "./app-url";

export function createOpaqueToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashOpaqueToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function buildAppUrl(path: string) {
  return buildAbsoluteAppUrl(path);
}
