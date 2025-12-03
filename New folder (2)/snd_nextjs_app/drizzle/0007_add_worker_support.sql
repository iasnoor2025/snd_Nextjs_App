-- Add worker support to project_manpower table
-- Make employeeId nullable and add workerName field

-- First, drop the existing foreign key constraint
ALTER TABLE "project_manpower" DROP CONSTRAINT "project_manpower_employee_id_fkey";

-- Make employeeId nullable
ALTER TABLE "project_manpower" ALTER COLUMN "employee_id" DROP NOT NULL;

-- Add workerName field
ALTER TABLE "project_manpower" ADD COLUMN "worker_name" text;

-- Re-add the foreign key constraint with ON DELETE SET NULL
ALTER TABLE "project_manpower" ADD CONSTRAINT "project_manpower_employee_id_fkey" 
FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON UPDATE CASCADE ON DELETE SET NULL;

-- Add a check constraint to ensure either employeeId or workerName is provided
ALTER TABLE "project_manpower" ADD CONSTRAINT "project_manpower_employee_or_worker_check" 
CHECK ("employee_id" IS NOT NULL OR "worker_name" IS NOT NULL);
