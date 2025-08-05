-- AlterTable
ALTER TABLE "public"."advance_payments" ADD COLUMN     "financeApprovalAt" TIMESTAMP(3),
ADD COLUMN     "financeApprovalBy" INTEGER,
ADD COLUMN     "financeApprovalNotes" TEXT,
ADD COLUMN     "hrApprovalAt" TIMESTAMP(3),
ADD COLUMN     "hrApprovalBy" INTEGER,
ADD COLUMN     "hrApprovalNotes" TEXT,
ADD COLUMN     "managerApprovalAt" TIMESTAMP(3),
ADD COLUMN     "managerApprovalBy" INTEGER,
ADD COLUMN     "managerApprovalNotes" TEXT,
ADD COLUMN     "notes" TEXT;
