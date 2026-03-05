/*
  Warnings:

  - You are about to drop the column `activationLink` on the `PendingUser` table. All the data in the column will be lost.
  - You are about to drop the column `activationLink` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "PendingUser_activationLink_key";

-- DropIndex
DROP INDEX "User_activationLink_key";

-- AlterTable
ALTER TABLE "PendingUser" DROP COLUMN "activationLink";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "activationLink";

-- CreateTable
CREATE TABLE "AccountActivationToken" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "pendingUserId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountActivationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountActivationToken_userId_key" ON "AccountActivationToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountActivationToken_pendingUserId_key" ON "AccountActivationToken"("pendingUserId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountActivationToken_token_key" ON "AccountActivationToken"("token");

-- AddForeignKey
ALTER TABLE "AccountActivationToken" ADD CONSTRAINT "AccountActivationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountActivationToken" ADD CONSTRAINT "AccountActivationToken_pendingUserId_fkey" FOREIGN KEY ("pendingUserId") REFERENCES "PendingUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
