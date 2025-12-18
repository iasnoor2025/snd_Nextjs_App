-- Add color field to roles table for customizable role colors
ALTER TABLE roles ADD COLUMN IF NOT EXISTS color text;

-- Set default colors for existing roles
UPDATE roles SET color = 'red' WHERE name = 'SUPER_ADMIN';
UPDATE roles SET color = 'blue' WHERE name = 'ADMIN';
UPDATE roles SET color = 'purple' WHERE name = 'MANAGER';
UPDATE roles SET color = 'orange' WHERE name = 'SUPERVISOR';
UPDATE roles SET color = 'green' WHERE name = 'OPERATOR';
UPDATE roles SET color = 'gray' WHERE name = 'EMPLOYEE';
UPDATE roles SET color = 'slate' WHERE name = 'USER';

