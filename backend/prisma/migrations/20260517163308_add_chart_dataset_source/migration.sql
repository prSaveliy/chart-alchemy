/*
  Warnings:

  - You are about to drop the column `datasetMeta` on the `Chart` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Chart" DROP COLUMN "datasetMeta",
ADD COLUMN     "datasetSourceId" INTEGER,
ADD COLUMN     "selectedType" TEXT,
ADD COLUMN     "selectedXField" TEXT,
ADD COLUMN     "selectedYField" TEXT;

-- CreateTable
CREATE TABLE "DatasetSource" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "rows" JSONB NOT NULL,
    "truncated" BOOLEAN NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DatasetSource_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Chart" ADD CONSTRAINT "Chart_datasetSourceId_fkey" FOREIGN KEY ("datasetSourceId") REFERENCES "DatasetSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
