import { getBearerToken, loadMobileSession, MobileAuthError, type MobileApp } from "@/lib/mobile-auth";

type MobileRole = "CUSTOMER" | "VENDOR" | "DELIVERY";
type LoadedMobileSession = Awaited<ReturnType<typeof loadMobileSession>>;
type MobileVendorSession = LoadedMobileSession & {
  user: LoadedMobileSession["user"] & { vendorId: string };
};
type MobileDeliverySession = LoadedMobileSession & {
  user: LoadedMobileSession["user"] & { deliveryPartnerId: string };
};

async function requireMobileSessionFor(request: Request, app: MobileApp, role: MobileRole) {
  const auth = await loadMobileSession(getBearerToken(request.headers));

  if (auth.app !== app || auth.user.role !== role) {
    throw new MobileAuthError(`${role.toLowerCase()} app access required.`, 403);
  }

  return auth;
}

export function requireMobileCustomer(request: Request) {
  return requireMobileSessionFor(request, "CUSTOMER_APP", "CUSTOMER");
}

export async function requireMobileVendor(request: Request): Promise<MobileVendorSession> {
  const auth = await requireMobileSessionFor(request, "VENDOR_APP", "VENDOR");
  if (!auth.user.vendorId) {
    throw new MobileAuthError("Vendor app access required.", 403);
  }

  return auth as MobileVendorSession;
}

export async function requireMobileDelivery(request: Request): Promise<MobileDeliverySession> {
  const auth = await requireMobileSessionFor(request, "DELIVERY_APP", "DELIVERY");
  if (!auth.user.deliveryPartnerId) {
    throw new MobileAuthError("Delivery app access required.", 403);
  }

  return auth as MobileDeliverySession;
}
