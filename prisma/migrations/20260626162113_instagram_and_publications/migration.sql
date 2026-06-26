-- CreateTable
CREATE TABLE "instagram_connected_account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "instagramUserId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "profilePictureUrl" TEXT,
    "accessToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "scopes" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'connected',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instagram_connected_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instagram_oauth_state" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instagram_oauth_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "destinationScope" TEXT NOT NULL,
    "caption" TEXT,
    "mediaUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publication_target" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "instagramConnectedAccountId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "instagramMediaId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publication_target_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "instagram_connected_account_userId_idx" ON "instagram_connected_account"("userId");

-- CreateIndex
CREATE INDEX "instagram_connected_account_status_idx" ON "instagram_connected_account"("status");

-- CreateIndex
CREATE UNIQUE INDEX "instagram_connected_account_userId_instagramUserId_key" ON "instagram_connected_account"("userId", "instagramUserId");

-- CreateIndex
CREATE UNIQUE INDEX "instagram_oauth_state_state_key" ON "instagram_oauth_state"("state");

-- CreateIndex
CREATE INDEX "instagram_oauth_state_userId_idx" ON "instagram_oauth_state"("userId");

-- CreateIndex
CREATE INDEX "instagram_oauth_state_expiresAt_idx" ON "instagram_oauth_state"("expiresAt");

-- CreateIndex
CREATE INDEX "publication_userId_idx" ON "publication"("userId");

-- CreateIndex
CREATE INDEX "publication_status_idx" ON "publication"("status");

-- CreateIndex
CREATE INDEX "publication_target_publicationId_idx" ON "publication_target"("publicationId");

-- CreateIndex
CREATE INDEX "publication_target_instagramConnectedAccountId_idx" ON "publication_target"("instagramConnectedAccountId");

-- CreateIndex
CREATE INDEX "publication_target_status_idx" ON "publication_target"("status");

-- AddForeignKey
ALTER TABLE "instagram_connected_account" ADD CONSTRAINT "instagram_connected_account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publication" ADD CONSTRAINT "publication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publication_target" ADD CONSTRAINT "publication_target_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publication_target" ADD CONSTRAINT "publication_target_instagramConnectedAccountId_fkey" FOREIGN KEY ("instagramConnectedAccountId") REFERENCES "instagram_connected_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
