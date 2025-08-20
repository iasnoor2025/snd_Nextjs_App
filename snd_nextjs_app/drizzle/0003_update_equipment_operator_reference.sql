-- Migration: Update equipment operator reference from employees to projectManpower
-- This migration changes the foreign key constraint for project_equipment.operator_id
-- from referencing employees.id to referencing project_manpower.id

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE project_equipment 
DROP CONSTRAINT IF EXISTS project_equipment_operator_id_fkey;

-- Step 2: Add the new foreign key constraint
ALTER TABLE project_equipment 
ADD CONSTRAINT project_equipment_operator_id_fkey 
FOREIGN KEY (operator_id) 
REFERENCES project_manpower(id) 
ON UPDATE CASCADE 
ON DELETE SET NULL;

-- Note: This migration assumes that existing operator_id values in project_equipment
-- correspond to valid project_manpower.id values. If this is not the case,
-- you may need to handle data migration separately before running this migration.
