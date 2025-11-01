-- Add is_external and company_name columns to employees table
-- Run this migration if the columns don't exist yet

-- Add is_external column
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS is_external BOOLEAN DEFAULT false NOT NULL;

-- Add company_name column
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS company_name TEXT;

