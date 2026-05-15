-- CreateEnum
CREATE TYPE "GenState" AS ENUM ('idle', 'in_progress');

-- AlterTable
ALTER TABLE "Chart" ADD COLUMN     "genState" "GenState" NOT NULL DEFAULT 'idle';
