-- CreateTable
CREATE TABLE "PendingUser" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "activationLink" TEXT NOT NULL,

    CONSTRAINT "PendingUser_pkey" PRIMARY KEY ("id")
);
