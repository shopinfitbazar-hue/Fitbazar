export const SUPPORT_STATUSES = ["OPEN", "PENDING", "RESOLVED", "CLOSED"] as const;

export type SupportStatus = (typeof SUPPORT_STATUSES)[number];

export type SupportThreadMessage = {
  id: string;
  sender: "CUSTOMER" | "ADMIN";
  message: string;
  createdAt: string | Date;
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
};

export function normalizeSupportStatus(value?: string | null): SupportStatus | null {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) return null;
  return SUPPORT_STATUSES.includes(normalized as SupportStatus) ? (normalized as SupportStatus) : null;
}

export function buildSupportMessages(ticket: {
  id: string;
  message: string;
  createdAt: string | Date;
  adminResponse?: string | null;
  updatedAt?: string | Date;
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
  messages?: Array<{
    id: string;
    sender: string;
    message: string;
    createdAt: string | Date;
    user?: {
      name?: string | null;
      email?: string | null;
      role?: string | null;
    } | null;
  }>;
}): SupportThreadMessage[] {
  const baseMessages = (ticket.messages || [])
    .map((message) => ({
      id: message.id,
      sender: (message.sender === "ADMIN" ? "ADMIN" : "CUSTOMER") as "ADMIN" | "CUSTOMER",
      message: message.message,
      createdAt: message.createdAt,
      user: message.user || null,
    }))
    .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());

  if (!baseMessages.length) {
    baseMessages.push({
      id: `${ticket.id}_initial`,
      sender: "CUSTOMER",
      message: ticket.message,
      createdAt: ticket.createdAt,
      user: ticket.user || null,
    });

    if (ticket.adminResponse) {
      baseMessages.push({
        id: `${ticket.id}_admin_legacy`,
        sender: "ADMIN",
        message: ticket.adminResponse,
        createdAt: ticket.updatedAt || ticket.createdAt,
        user: null,
      });
    }
  }

  return baseMessages;
}
