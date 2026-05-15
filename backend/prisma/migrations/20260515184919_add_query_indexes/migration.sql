-- CreateIndex
CREATE INDEX "AccountActivationToken_expiresAt_idx" ON "AccountActivationToken"("expiresAt");

-- CreateIndex
CREATE INDEX "Chart_userId_updatedAt_idx" ON "Chart"("userId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE INDEX "ResetPasswordToken_email_idx" ON "ResetPasswordToken"("email");

-- CreateIndex
CREATE INDEX "ResetPasswordToken_expiresAt_idx" ON "ResetPasswordToken"("expiresAt");
