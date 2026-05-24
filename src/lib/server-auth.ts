import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVendorAccessState } from "@/lib/vendor-access";

type AuthError =
  | { error: "Unauthorized" | "Forbidden" | "Vendor account not linked" | "Vendor not found" }
  | { error: "Vendor suspended" }
  | { error: "Vendor pending approval" };
type UserSessionResult = { session: Session };
type VendorSessionResult = {
  session: Session;
  vendor: {
    id: string;
    shopName: string;
    slug: string;
    isApproved: boolean;
    isSuspended: boolean;
    commissionPct: number;
  };
};

type RequireVendorSessionOptions = {
  allowPending?: boolean;
  allowSuspended?: boolean;
};

export async function requireUserSession(): Promise<AuthError | UserSessionResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  return { session };
}

export async function requireVendorSession(
  options: RequireVendorSessionOptions = {},
): Promise<AuthError | VendorSessionResult> {
  const sessionResult = await requireUserSession();
  if ("error" in sessionResult) return sessionResult;

  const { session } = sessionResult;

  if (session.user.role !== "VENDOR" && session.user.role !== "ADMIN") {
    return { error: "Forbidden" };
  }

  const vendorId =
    session.user.role === "ADMIN"
      ? session.user.vendorId || null
      : session.user.vendorId || null;

  if (!vendorId) {
    return { error: "Vendor account not linked" };
  }

  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: {
      id: true,
      shopName: true,
      slug: true,
      isApproved: true,
      isSuspended: true,
      commissionPct: true,
    },
  });

  if (!vendor) {
    return { error: "Vendor not found" };
  }

  const accessState = getVendorAccessState(vendor);
  if (!accessState.canOperate) {
    if (accessState.reason === "Vendor suspended" && !options.allowSuspended) {
      return { error: "Vendor suspended" };
    }

    if (accessState.reason === "Vendor pending approval" && !options.allowPending) {
      return { error: "Vendor pending approval" };
    }
  }

  return { session, vendor };
}

export async function requireAdminSession(): Promise<AuthError | UserSessionResult> {
  const sessionResult = await requireUserSession();
  if ("error" in sessionResult) return sessionResult;

  const { session } = sessionResult;

  if (session.user.role !== "ADMIN") {
    return { error: "Forbidden" };
  }

  return { session };
}
