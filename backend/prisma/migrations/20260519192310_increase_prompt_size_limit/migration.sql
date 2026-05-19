/*
  Warnings:

  - You are about to alter the column `prompt` on the `AiChartVersion` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(5000)`.

*/
-- AlterTable
ALTER TABLE "AiChartVersion" ALTER COLUMN "prompt" SET DATA TYPE VARCHAR(5000);
