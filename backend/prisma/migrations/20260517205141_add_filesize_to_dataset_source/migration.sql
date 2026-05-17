/*
  Warnings:

  - Added the required column `fileSize` to the `DatasetSource` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DatasetSource" ADD COLUMN     "fileSize" INTEGER NOT NULL;
