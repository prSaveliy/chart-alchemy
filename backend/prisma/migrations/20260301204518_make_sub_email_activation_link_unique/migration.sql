/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `PendingUser` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[activationLink]` on the table `PendingUser` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sub]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PendingUser_email_key" ON "PendingUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PendingUser_activationLink_key" ON "PendingUser"("activationLink");

-- CreateIndex
CREATE UNIQUE INDEX "User_sub_key" ON "User"("sub");
