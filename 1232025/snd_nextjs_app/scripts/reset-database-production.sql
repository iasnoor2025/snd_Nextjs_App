-- Production Database Reset Script
-- This script will completely reset all tables and data
-- WARNING: This will delete ALL data - use only for production preparation

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Drop all tables in dependency order
DROP TABLE IF EXISTS 
    advance_payments,
    employee_leaves,
    employee_assignments,
    employee_documents,
    employee_equipment,
    employee_permissions,
    employee_projects,
    employee_rentals,
    employee_timesheets,
    equipment_assignments,
    equipment_documents,
    equipment_maintenance,
    equipment_operators,
    equipment_rentals,
    equipment_usage,
    project_equipment,
    project_materials,
    project_workers,
    rental_equipment,
    rental_materials,
    rental_workers,
    timesheet_records,
    user_permissions,
    user_roles,
    webhook_logs,
    webhook_subscriptions,
    
    cache,
    company_documents,
    customers,
    departments,
    designations,
    employees,
    equipment,
    equipment_categories,
    equipment_types,
    materials,
    material_categories,
    projects,
    rentals,
    roles,
    timesheets,
    users,
    vehicle_assignments,
    vehicle_documents,
    vehicle_maintenance,
    vehicle_operators,
    vehicle_rentals,
    vehicle_usage,
    vehicles,
    vehicle_types,
    webhooks,
    work_orders,
    work_order_equipment,
    work_order_materials,
    work_order_workers CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Reset sequences
DO $$
DECLARE
    seq_name text;
BEGIN
    FOR seq_name IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || seq_name || ' CASCADE';
    END LOOP;
END $$;

-- Clean up any remaining objects
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Reset search path
SET search_path TO public;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Database reset completed successfully. All tables and data have been removed.';
    RAISE NOTICE 'Ready for fresh production deployment.';
END $$;
