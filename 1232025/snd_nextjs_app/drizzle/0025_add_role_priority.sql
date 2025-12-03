-- Add priority field to roles table for dynamic role hierarchy
ALTER TABLE roles ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 999;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing roles with priority values
UPDATE roles SET priority = 1 WHERE name = 'SUPER_ADMIN';
UPDATE roles SET priority = 2 WHERE name = 'ADMIN';
UPDATE roles SET priority = 3 WHERE name = 'MANAGER';
UPDATE roles SET priority = 4 WHERE name = 'SUPERVISOR';
UPDATE roles SET priority = 5 WHERE name = 'OPERATOR';
UPDATE roles SET priority = 6 WHERE name = 'EMPLOYEE';
UPDATE roles SET priority = 7 WHERE name = 'USER';

-- Set is_active to true for all existing roles
UPDATE roles SET is_active = true WHERE is_active IS NULL;
