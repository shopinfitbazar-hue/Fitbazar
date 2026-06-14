import { prisma } from "@/lib/prisma";

export const PARTNER_PLAN_MONTHLY = "MONTHLY";
export const PARTNER_PLAN_ANNUAL = "ANNUAL";
export const PARTNER_STATUS_NONE = "NONE";
export const PARTNER_STATUS_PENDING = "PENDING";
export const PARTNER_STATUS_ACTIVE = "ACTIVE";
export const PARTNER_STATUS_EXPIRED = "EXPIRED";
export const PARTNER_STATUS_REJECTED = "REJECTED";

export const partnerPlans = {
  [PARTNER_PLAN_MONTHLY]: {
    label: "Monthly Partner",
    months: 1,
    amount: 4000,
    monthlyEquivalent: 4000,
  },
  [PARTNER_PLAN_ANNUAL]: {
    label: "Annual Partner",
    months: 12,
    amount: 24000,
    monthlyEquivalent: 2000,
  },
} as const;

export type PartnerPlanKey = keyof typeof partnerPlans;

export function normalizePartnerPlan(plan: unknown): PartnerPlanKey {
  return String(plan).toUpperCase() === PARTNER_PLAN_ANNUAL ? PARTNER_PLAN_ANNUAL : PARTNER_PLAN_MONTHLY;
}

export function getPartnerPlan(plan: unknown) {
  return partnerPlans[normalizePartnerPlan(plan)];
}

export function getPartnerExpiry(startDate: Date, plan: unknown) {
  const normalized = normalizePartnerPlan(plan);
  const expiresAt = new Date(startDate);
  expiresAt.setMonth(expiresAt.getMonth() + partnerPlans[normalized].months);
  return expiresAt;
}

export function formatPartnerAmount(amount: number) {
  return `NPR ${Math.round(amount).toLocaleString("en-NP")}`;
}

const PARTNER_EXPIRY_CHECK_INTERVAL_MS = 5 * 60 * 1000;
let nextPartnerExpiryCheckAt = 0;
let pendingPartnerExpiryCheck: Promise<number> | null = null;

export async function expireExpiredPartnerships(options: { force?: boolean } = {}) {
  const now = Date.now();
  if (!options.force && now < nextPartnerExpiryCheckAt) {
    return 0;
  }

  if (pendingPartnerExpiryCheck) {
    return pendingPartnerExpiryCheck;
  }

  nextPartnerExpiryCheckAt = now + PARTNER_EXPIRY_CHECK_INTERVAL_MS;
  pendingPartnerExpiryCheck = prisma.vendor
    .updateMany({
      where: {
        isPartnered: true,
        partnerExpiresAt: {
          lt: new Date(),
        },
      },
      data: {
        isPartnered: false,
        isTopShop: false,
        partnerStatus: PARTNER_STATUS_EXPIRED,
      },
    })
    .then((result) => result.count)
    .catch((error) => {
      nextPartnerExpiryCheckAt = Date.now() + 60 * 1000;
      console.error("Error expiring partner shops:", error);
      return 0;
    })
    .finally(() => {
      pendingPartnerExpiryCheck = null;
    });

  return pendingPartnerExpiryCheck;
}
