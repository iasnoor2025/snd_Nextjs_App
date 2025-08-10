-- Remove employee_id column from employees table
-- Since we have file_number as the identifier, employee_id is redundant

-- Drop the unique index on employee_id first
DROP INDEX IF EXISTS "employees_employee_id_key";

-- Drop the employee_id column
ALTER TABLE "employees" DROP COLUMN IF EXISTS "employee_id";
