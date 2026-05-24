CREATE TABLE "VendorReview" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "orderId" TEXT,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "isVisible" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "VendorReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VendorReview_userId_vendorId_key" ON "VendorReview"("userId", "vendorId");
CREATE INDEX "VendorReview_vendorId_isVisible_createdAt_idx" ON "VendorReview"("vendorId", "isVisible", "createdAt");

ALTER TABLE "VendorReview"
ADD CONSTRAINT "VendorReview_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VendorReview"
ADD CONSTRAINT "VendorReview_vendorId_fkey"
FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VendorReview"
ADD CONSTRAINT "VendorReview_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
