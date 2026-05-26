import type { Role } from "@prisma/client";
import { getSafeHref } from "./media";

export type BroadcastAudience = "CUSTOMERS" | "VENDORS" | "ALL";

export type BroadcastRecipientInput = {
  id: string;
  name: string | null;
  email: string;
  role: Role | string;
};

export type BroadcastRecipientReport = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  notificationSent: boolean;
  emailSent: boolean;
};

export const BROADCAST_TITLE_MAX_LENGTH = 120;
export const BROADCAST_MESSAGE_MAX_LENGTH = 2000;

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function normalizeBroadcastAudience(value?: string): BroadcastAudience {
  if (value === "VENDORS" || value === "ALL") return value;
  return "CUSTOMERS";
}

export function normalizeBroadcastLink(value?: string | null) {
  const requestedLink = value?.trim();
  if (!requestedLink || !requestedLink.startsWith("/") || requestedLink.startsWith("//")) {
    return "/account/notifications";
  }

  return getSafeHref(requestedLink, "/account/notifications");
}

export function getRecipientNotificationLink(role: string, link: string) {
  return role === "VENDOR" && link === "/account/notifications" ? "/vendor/dashboard" : link;
}

export function validateBroadcastContent(input: { title?: string | null; message?: string | null }) {
  const title = input.title?.trim() || "";
  const message = input.message?.trim() || "";

  if (!title || !message) {
    return { ok: false as const, error: "Title and message are required." };
  }

  if (title.length > BROADCAST_TITLE_MAX_LENGTH) {
    return { ok: false as const, error: `Title must be ${BROADCAST_TITLE_MAX_LENGTH} characters or less.` };
  }

  if (message.length > BROADCAST_MESSAGE_MAX_LENGTH) {
    return { ok: false as const, error: `Message must be ${BROADCAST_MESSAGE_MAX_LENGTH} characters or less.` };
  }

  return { ok: true as const, title, message };
}

export function buildBroadcastRecipientReport(recipients: BroadcastRecipientInput[]): BroadcastRecipientReport[] {
  return recipients.map((recipient) => ({
    id: recipient.id,
    name: recipient.name,
    email: recipient.email,
    role: String(recipient.role),
    notificationSent: true,
    emailSent: false,
  }));
}
