-- AlterTable
ALTER TABLE "employee_advances" ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "remaining_balance" DECIMAL(10,2),
ADD COLUMN     "repaid_amount" DECIMAL(10,2),
ADD COLUMN     "repayment_date" TIMESTAMP(3);
