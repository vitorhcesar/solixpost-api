-- CreateTable
CREATE TABLE "wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "referenceKey" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_recharge" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "omegapayTransactionId" TEXT,
    "pixCode" TEXT,
    "pixImageUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_recharge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallet_userId_key" ON "wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transaction_referenceKey_key" ON "wallet_transaction"("referenceKey");

-- CreateIndex
CREATE INDEX "wallet_transaction_walletId_idx" ON "wallet_transaction"("walletId");

-- CreateIndex
CREATE INDEX "wallet_transaction_createdAt_idx" ON "wallet_transaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_recharge_identifier_key" ON "wallet_recharge"("identifier");

-- CreateIndex
CREATE INDEX "wallet_recharge_walletId_idx" ON "wallet_recharge"("walletId");

-- CreateIndex
CREATE INDEX "wallet_recharge_status_idx" ON "wallet_recharge"("status");

-- CreateIndex
CREATE INDEX "wallet_recharge_omegapayTransactionId_idx" ON "wallet_recharge"("omegapayTransactionId");

-- AddForeignKey
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transaction" ADD CONSTRAINT "wallet_transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_recharge" ADD CONSTRAINT "wallet_recharge_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create wallets for existing users
INSERT INTO "wallet" ("id", "userId", "balance", "createdAt", "updatedAt")
SELECT 'wallet_' || "id", "id", 0, NOW(), NOW()
FROM "user"
WHERE NOT EXISTS (
    SELECT 1 FROM "wallet" WHERE "wallet"."userId" = "user"."id"
);
