-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'pending';

-- AlterTable
ALTER TABLE "SaleItem" ADD COLUMN     "freeQty" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ClientSyncHealth" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceName" TEXT,
    "appVersion" TEXT NOT NULL,
    "lastSyncTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSuccessSync" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "pendingRecords" INTEGER NOT NULL DEFAULT 0,
    "osPlatform" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientSyncHealth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientSyncHealth_deviceId_key" ON "ClientSyncHealth"("deviceId");

-- CreateIndex
CREATE INDEX "ClientSyncHealth_companyId_idx" ON "ClientSyncHealth"("companyId");

-- AddForeignKey
ALTER TABLE "ClientSyncHealth" ADD CONSTRAINT "ClientSyncHealth_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
