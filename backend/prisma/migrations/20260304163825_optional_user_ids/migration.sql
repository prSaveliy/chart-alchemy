-- AlterTable
ALTER TABLE "AccountActivationToken" ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "pendingUserId" DROP NOT NULL;
