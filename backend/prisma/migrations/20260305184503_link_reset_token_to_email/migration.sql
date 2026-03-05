/*
  Warnings:

  - You are about to drop the column `userId` on the `ResetPasswordToken` table. All the data in the column will be lost.
  - Added the required column `email` to the `ResetPasswordToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ResetPasswordToken" DROP CONSTRAINT "ResetPasswordToken_userId_fkey";

-- AlterTable
ALTER TABLE "ResetPasswordToken" DROP COLUMN "userId",
ADD COLUMN     "email" TEXT NOT NULL;
