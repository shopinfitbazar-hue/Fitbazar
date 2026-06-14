-- Partner subscription workflow and homepage product placement controls.
ALTER TABLE "Vendor"
ADD COLUMN "partnerStatus" TEXT NOT NULL DEFAULT 'NONE',
ADD COLUMN "partnerPlan" TEXT,
ADD COLUMN "partnerRequestedAt" TIMESTAMP(3),
ADD COLUMN "partnerStartedAt" TIMESTAMP(3),
ADD COLUMN "partnerExpiresAt" TIMESTAMP(3),
ADD COLUMN "partnerRenewedAt" TIMESTAMP(3),
ADD COLUMN "partnerPaymentDue" DOUBLE PRECISION,
ADD COLUMN "partnerPaymentNote" TEXT;

ALTER TABLE "Product"
ADD COLUMN "homepageSlot" TEXT NOT NULL DEFAULT 'AUTO',
ADD COLUMN "homepagePriority" INTEGER NOT NULL DEFAULT 0;

UPDATE "Vendor"
SET "partnerStatus" = CASE WHEN "isPartnered" = true THEN 'ACTIVE' ELSE 'NONE' END
WHERE "partnerStatus" = 'NONE';

CREATE INDEX "Vendor_partnerStatus_partnerExpiresAt_idx" ON "Vendor"("partnerStatus", "partnerExpiresAt");
CREATE INDEX "Product_homepageSlot_homepagePriority_idx" ON "Product"("homepageSlot", "homepagePriority");
