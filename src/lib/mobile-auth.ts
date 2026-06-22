import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createOpaqueToken, hashOpaqueToken } from "@/lib/tokens";

export const MOBILE_APPS = ["CUSTOMER_APP", "VENDOR_APP", "DELIVERY_APP"] as const;
export type MobileApp = (typeof MOBILE_APPS)[number];

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type MobileUserRecord = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  role: Role;
  isBanned: boolean;
  vendorProfile: {
    id: string;
    isSuspended: boolean;
  } | null;
  deliveryProfile: {
    id: string;
    isActive: boolean;
    isSuspended: boolean;
  } | null;
};

export class MobileAuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "MobileAuthError";
    this.status = status;
  }
}

export function normalizeMobileApp(value: unknown): MobileApp {
  return MOBILE_APPS.includes(value as MobileApp) ? (value as MobileApp) : "CUSTOMER_APP";
}

export function isMobileAppRoleAllowed(app: MobileApp, user: Pick<MobileUserRecord, "role" | "vendorProfile">) {
  if (app === "CUSTOMER_APP") return user.role === Role.CUSTOMER;
  if (app === "VENDOR_APP") return user.role === Role.VENDOR && Boolean(user.vendorProfile);
  return user.role === Role.DELIVERY && Boolean((user as MobileUserRecord).deliveryProfile);
}

function sanitizeDeviceId(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 128) : null;
}

function buildExpiry(ttlMs: number) {
  return new Date(Date.now() + ttlMs);
}

function toMobileSessionUser(user: MobileUserRecord) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    image: user.image,
    role: user.role,
    vendorId: user.vendorProfile?.id ?? null,
    deliveryPartnerId: user.deliveryProfile?.id ?? null,
  };
}

function assertUserCanUseMobileApp(app: MobileApp, user: MobileUserRecord) {
  if (user.isBanned) {
    throw new MobileAuthError("Your account has been suspended.", 403);
  }

  if (!isMobileAppRoleAllowed(app, user)) {
    throw new MobileAuthError("This account cannot use the selected FitBazar app.", 403);
  }

  if (app === "VENDOR_APP" && user.vendorProfile?.isSuspended) {
    throw new MobileAuthError("Your vendor account has been suspended.", 403);
  }

  if (app === "DELIVERY_APP" && (!user.deliveryProfile?.isActive || user.deliveryProfile.isSuspended)) {
    throw new MobileAuthError("Your delivery partner account is not active.", 403);
  }
}

async function createMobileSession(input: {
  user: MobileUserRecord;
  app: MobileApp;
  deviceId?: unknown;
}) {
  const accessToken = createOpaqueToken();
  const refreshToken = createOpaqueToken();
  const expiresAt = buildExpiry(ACCESS_TOKEN_TTL_MS);
  const refreshExpiresAt = buildExpiry(REFRESH_TOKEN_TTL_MS);

  await prisma.mobileSession.create({
    data: {
      userId: input.user.id,
      app: input.app,
      deviceId: sanitizeDeviceId(input.deviceId),
      accessTokenHash: hashOpaqueToken(accessToken),
      refreshTokenHash: hashOpaqueToken(refreshToken),
      expiresAt,
      refreshExpiresAt,
      lastUsedAt: new Date(),
    },
  });

  return {
    user: toMobileSessionUser(input.user),
    accessToken,
    refreshToken,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function createMobileCustomerSession(userId: string, deviceId?: unknown) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      role: true,
      isBanned: true,
      vendorProfile: { select: { id: true, isSuspended: true } },
      deliveryProfile: { select: { id: true, isActive: true, isSuspended: true } },
    },
  });

  if (!user) throw new MobileAuthError("Account not found.", 404);
  assertUserCanUseMobileApp("CUSTOMER_APP", user);
  return createMobileSession({ user, app: "CUSTOMER_APP", deviceId });
}

export async function authenticateMobileCredentials(input: {
  email?: unknown;
  password?: unknown;
  app?: unknown;
  deviceId?: unknown;
}) {
  if (typeof input.email !== "string" || typeof input.password !== "string") {
    throw new MobileAuthError("Email and password are required.", 400);
  }

  const app = normalizeMobileApp(input.app);
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!email || !password) {
    throw new MobileAuthError("Email and password are required.", 400);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      role: true,
      password: true,
      isBanned: true,
      vendorProfile: {
        select: {
          id: true,
          isSuspended: true,
        },
      },
      deliveryProfile: {
        select: {
          id: true,
          isActive: true,
          isSuspended: true,
        },
      },
    },
  });

  if (!user?.password) {
    throw new MobileAuthError("Invalid email or password.", 401);
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new MobileAuthError("Invalid email or password.", 401);
  }

  assertUserCanUseMobileApp(app, user);

  return createMobileSession({
    user,
    app,
    deviceId: input.deviceId,
  });
}

export async function refreshMobileSession(input: {
  refreshToken?: unknown;
  deviceId?: unknown;
}) {
  if (typeof input.refreshToken !== "string" || !input.refreshToken.trim()) {
    throw new MobileAuthError("Refresh token is required.", 400);
  }

  const existing = await prisma.mobileSession.findUnique({
    where: {
      refreshTokenHash: hashOpaqueToken(input.refreshToken),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          role: true,
          isBanned: true,
          vendorProfile: {
            select: {
              id: true,
              isSuspended: true,
            },
          },
          deliveryProfile: {
            select: {
              id: true,
              isActive: true,
              isSuspended: true,
            },
          },
        },
      },
    },
  });

  if (!existing || existing.revokedAt || existing.refreshExpiresAt <= new Date()) {
    throw new MobileAuthError("Mobile session has expired.", 401);
  }

  const app = normalizeMobileApp(existing.app);
  assertUserCanUseMobileApp(app, existing.user);

  const accessToken = createOpaqueToken();
  const refreshToken = createOpaqueToken();
  const expiresAt = buildExpiry(ACCESS_TOKEN_TTL_MS);

  await prisma.mobileSession.update({
    where: {
      id: existing.id,
    },
    data: {
      accessTokenHash: hashOpaqueToken(accessToken),
      refreshTokenHash: hashOpaqueToken(refreshToken),
      expiresAt,
      refreshExpiresAt: buildExpiry(REFRESH_TOKEN_TTL_MS),
      deviceId: sanitizeDeviceId(input.deviceId) ?? existing.deviceId,
      lastUsedAt: new Date(),
    },
  });

  return {
    user: toMobileSessionUser(existing.user),
    accessToken,
    refreshToken,
    expiresAt: expiresAt.toISOString(),
  };
}

export function getBearerToken(headers: Headers) {
  const authorization = headers.get("authorization") || headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  return token || null;
}

export async function loadMobileSession(accessToken: string | null) {
  if (!accessToken) {
    throw new MobileAuthError("Unauthorized", 401);
  }

  const session = await prisma.mobileSession.findUnique({
    where: {
      accessTokenHash: hashOpaqueToken(accessToken),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          role: true,
          isBanned: true,
          vendorProfile: {
            select: {
              id: true,
              isSuspended: true,
            },
          },
          deliveryProfile: {
            select: {
              id: true,
              isActive: true,
              isSuspended: true,
            },
          },
        },
      },
    },
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    throw new MobileAuthError("Unauthorized", 401);
  }

  const app = normalizeMobileApp(session.app);
  assertUserCanUseMobileApp(app, session.user);

  await prisma.mobileSession.update({
    where: { id: session.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => undefined);

  return {
    session,
    app,
    user: toMobileSessionUser(session.user),
  };
}

export async function revokeMobileSession(input: {
  accessToken?: string | null;
  refreshToken?: unknown;
}) {
  const tokenHash =
    input.accessToken
      ? { accessTokenHash: hashOpaqueToken(input.accessToken) }
      : typeof input.refreshToken === "string" && input.refreshToken.trim()
        ? { refreshTokenHash: hashOpaqueToken(input.refreshToken) }
        : null;

  if (!tokenHash) return;

  await prisma.mobileSession.updateMany({
    where: {
      ...tokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
