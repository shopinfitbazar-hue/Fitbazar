ALTER TABLE "Vendor"
ADD COLUMN "isPartnered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isTopShop" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Vendor"
SET "isPartnered" = true
WHERE "isApproved" = true
  AND "isSuspended" = false;

ALTER TABLE "SiteSettings"
ADD COLUMN "supportEmail" TEXT NOT NULL DEFAULT 'support@fitbazar.com',
ADD COLUMN "supportPhone" TEXT NOT NULL DEFAULT '+977 9800000000',
ADD COLUMN "supportHours" TEXT;

CREATE TABLE "SupportTicket" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "orderNumber" TEXT,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "adminResponse" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SupportTicket_status_createdAt_idx" ON "SupportTicket"("status", "createdAt");

ALTER TABLE "SupportTicket"
ADD CONSTRAINT "SupportTicket_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
