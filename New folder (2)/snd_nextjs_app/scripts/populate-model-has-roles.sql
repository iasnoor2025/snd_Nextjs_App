-- Populate model_has_roles table with existing user-role relationships
-- This script migrates the old role_id system to the new modelHasRoles relationship table

-- First, let's see what we have
SELECT 'Current users with role_id:' as info;
SELECT id, name, email, role_id FROM users WHERE role_id IS NOT NULL ORDER BY id;

SELECT 'Available roles:' as info;
SELECT id, name FROM roles ORDER BY id;

-- Clear existing relationships (if any)
DELETE FROM model_has_roles;

-- Insert user-role relationships based on current role_id
INSERT INTO model_has_roles (user_id, role_id)
SELECT id, role_id 
FROM users 
WHERE role_id IS NOT NULL;

-- Verify the migration
SELECT 'Migration results:' as info;
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    r.id as role_id,
    r.name as role_name
FROM users u
JOIN model_has_roles mhr ON u.id = mhr.user_id
JOIN roles r ON mhr.role_id = r.id
ORDER BY u.id;

-- Show count of relationships created
SELECT 'Total relationships created:' as info, COUNT(*) as count FROM model_has_roles;
