ALTER TABLE "Vendor"
ADD COLUMN "address" TEXT,
ADD COLUMN "zone" TEXT,
ADD COLUMN "district" TEXT,
ADD COLUMN "bankName" TEXT,
ADD COLUMN "accountNumber" TEXT,
ADD COLUMN "accountHolder" TEXT,
ADD COLUMN "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN "adminNotes" TEXT;
