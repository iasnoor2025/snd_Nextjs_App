/*
  Warnings:

  - You are about to drop the `employee_advances` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "employee_advances" DROP CONSTRAINT "employee_advances_employee_id_fkey";

-- DropTable
DROP TABLE "employee_advances";

-- CreateTable
CREATE TABLE "advance_payments" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "purpose" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approved_by" INTEGER,
    "approved_at" TIMESTAMP(3),
    "rejected_by" INTEGER,
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "repayment_date" TIMESTAMP(3),
    "estimated_months" INTEGER,
    "monthly_deduction" DECIMAL(10,2),
    "payment_date" TIMESTAMP(3),
    "repaid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "advance_payments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "advance_payments" ADD CONSTRAINT "advance_payments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
