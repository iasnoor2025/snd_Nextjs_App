-- Fix document table timestamps to support proper ordering
-- This migration changes date fields to timestamp fields for better querying

-- Update employee_documents table
ALTER TABLE "employee_documents" 
ALTER COLUMN "created_at" TYPE timestamp USING "created_at"::timestamp,
ALTER COLUMN "updated_at" TYPE timestamp USING "updated_at"::timestamp;

-- Update equipment_documents table  
ALTER TABLE "equipment_documents"
ALTER COLUMN "created_at" TYPE timestamp USING "created_at"::timestamp,
ALTER COLUMN "updated_at" TYPE timestamp USING "updated_at"::timestamp;

-- Add default values for updated_at columns
ALTER TABLE "employee_documents" 
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "equipment_documents"
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
