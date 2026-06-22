CREATE TABLE "MobileAuthCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MobileAuthCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MobileAuthCode_tokenHash_key" ON "MobileAuthCode"("tokenHash");
CREATE INDEX "MobileAuthCode_userId_createdAt_idx" ON "MobileAuthCode"("userId", "createdAt");
CREATE INDEX "MobileAuthCode_expiresAt_usedAt_idx" ON "MobileAuthCode"("expiresAt", "usedAt");

ALTER TABLE "MobileAuthCode"
ADD CONSTRAINT "MobileAuthCode_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
