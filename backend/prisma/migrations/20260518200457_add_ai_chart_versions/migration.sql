-- AlterTable
ALTER TABLE "Chart" ADD COLUMN     "activeAiVersionId" INTEGER;

-- CreateTable
CREATE TABLE "AiChartVersion" (
    "id" SERIAL NOT NULL,
    "chartId" INTEGER NOT NULL,
    "config" JSONB NOT NULL,
    "prompt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiChartVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiChartVersion_chartId_createdAt_idx" ON "AiChartVersion"("chartId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "AiChartVersion" ADD CONSTRAINT "AiChartVersion_chartId_fkey" FOREIGN KEY ("chartId") REFERENCES "Chart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
