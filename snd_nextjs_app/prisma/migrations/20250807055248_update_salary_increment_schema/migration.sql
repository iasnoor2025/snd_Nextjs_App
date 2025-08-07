/*
  Warnings:

  - You are about to drop the column `amount` on the `salary_increments` table. All the data in the column will be lost.
  - You are about to drop the column `percentage` on the `salary_increments` table. All the data in the column will be lost.
  - Added the required column `current_base_salary` to the `salary_increments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `new_base_salary` to the `salary_increments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requested_by` to the `salary_increments` table without a default value. This is not possible if the table is not empty.
  - Made the column `reason` on table `salary_increments` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."salary_increments" DROP COLUMN "amount",
DROP COLUMN "percentage",
ADD COLUMN     "current_base_salary" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "current_food_allowance" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "current_housing_allowance" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "current_transport_allowance" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "increment_amount" DECIMAL(10,2),
ADD COLUMN     "increment_percentage" DECIMAL(5,2),
ADD COLUMN     "new_base_salary" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "new_food_allowance" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "new_housing_allowance" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "new_transport_allowance" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "rejected_at" TIMESTAMP(3),
ADD COLUMN     "rejected_by" INTEGER,
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "requested_by" INTEGER NOT NULL,
ALTER COLUMN "reason" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."salary_increments" ADD CONSTRAINT "salary_increments_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salary_increments" ADD CONSTRAINT "salary_increments_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salary_increments" ADD CONSTRAINT "salary_increments_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
