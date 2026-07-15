-- CreateEnum
CREATE TYPE "RiderVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Rider" ADD COLUMN     "verificationStatus" "RiderVerificationStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Rider_verificationStatus_idx" ON "Rider"("verificationStatus");
