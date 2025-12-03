-- Remove salary advance related fields from employees table
ALTER TABLE "employees" DROP COLUMN IF EXISTS "advance_salary_eligible";
ALTER TABLE "employees" DROP COLUMN IF EXISTS "advance_salary_approved_this_month";
