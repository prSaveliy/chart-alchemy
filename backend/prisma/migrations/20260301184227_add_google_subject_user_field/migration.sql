-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sub" TEXT,
ALTER COLUMN "password" DROP NOT NULL;
