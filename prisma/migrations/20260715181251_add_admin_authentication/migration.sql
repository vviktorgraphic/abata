-- CreateEnum
CREATE TYPE "AdminAuthEventType" AS ENUM ('PASSWORD_LOGIN_ATTEMPT', 'TWO_FACTOR_REQUESTED', 'TWO_FACTOR_ATTEMPT', 'LOGIN_SUCCEEDED', 'LOGIN_FAILED', 'LOGOUT', 'SESSION_REVOKED');

-- AlterEnum
ALTER TYPE "EmailType" ADD VALUE 'ADMIN_LOGIN_CODE';

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failedPasswordAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminLoginChallenge" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "challengeTokenHash" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "failedCodeAttempts" INTEGER NOT NULL DEFAULT 0,
    "maxCodeAttempts" INTEGER NOT NULL DEFAULT 5,
    "requestedIpHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminLoginChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuthEvent" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT,
    "eventType" "AdminAuthEventType" NOT NULL,
    "success" BOOLEAN NOT NULL,
    "reasonCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuthEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_normalizedEmail_key" ON "AdminUser"("normalizedEmail");

-- CreateIndex
CREATE UNIQUE INDEX "AdminLoginChallenge_challengeTokenHash_key" ON "AdminLoginChallenge"("challengeTokenHash");

-- CreateIndex
CREATE INDEX "AdminLoginChallenge_adminUserId_expiresAt_idx" ON "AdminLoginChallenge"("adminUserId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");

-- CreateIndex
CREATE INDEX "AdminAuthEvent_adminUserId_createdAt_idx" ON "AdminAuthEvent"("adminUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "AdminLoginChallenge" ADD CONSTRAINT "AdminLoginChallenge_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuthEvent" ADD CONSTRAINT "AdminAuthEvent_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
