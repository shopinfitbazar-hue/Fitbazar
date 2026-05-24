import crypto from "node:crypto";

export function createOpaqueToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashOpaqueToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function buildAppUrl(path: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3002";
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
