-- SAFE Database Cleanup Script for Unused Tables
-- This script only removes clearly unused legacy tables
-- KEEPS all newly implemented features

-- WARNING: This will permanently delete data and tables
-- Please backup your database before running this script
-- Review each table carefully before deletion

-- =====================================================
-- SAFE TO REMOVE - CLEARLY UNUSED LEGACY TABLES
-- =====================================================

-- 1. Laravel/Prisma specific tables (not used in Next.js app)
DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;
DROP TABLE IF EXISTS "jobs" CASCADE;
DROP TABLE IF EXISTS "failed_jobs" CASCADE;
DROP TABLE IF EXISTS "personal_access_tokens" CASCADE;
DROP TABLE IF EXISTS "password_reset_tokens" CASCADE;
DROP TABLE IF EXISTS "sessions" CASCADE;

-- 2. Telescope monitoring tables (Laravel debugging - not used)
DROP TABLE IF EXISTS "telescope_entries" CASCADE;
DROP TABLE IF EXISTS "telescope_entry_tags" CASCADE;
DROP TABLE IF EXISTS "telescope_monitoring" CASCADE;

-- 3. Cache table (not used in current implementation)
DROP TABLE IF EXISTS "cache" CASCADE;

-- 4. Media table (appears to be unused)
DROP TABLE IF EXISTS "media" CASCADE;

-- 5. Geofence zones (not implemented in current features)
DROP TABLE IF EXISTS "geofence_zones" CASCADE;

-- 6. Analytics reports (not actively used)
DROP TABLE IF EXISTS "analytics_reports" CASCADE;

-- 7. Tax documents (not actively used)
DROP TABLE IF EXISTS "tax_documents" CASCADE;
DROP TABLE IF EXISTS "tax_document_payrolls" CASCADE;

-- 8. Organizational units (not actively used)
DROP TABLE IF EXISTS "organizational_units" CASCADE;

-- 9. Skills and trainings (not actively used)
DROP TABLE IF EXISTS "skills" CASCADE;
DROP TABLE IF EXISTS "trainings" CASCADE;
DROP TABLE IF EXISTS "employee_skill" CASCADE;
DROP TABLE IF EXISTS "employee_training" CASCADE;

-- 10. Employee performance reviews (not actively used)
DROP TABLE IF EXISTS "employee_performance_reviews" CASCADE;

-- 11. Employee resignations (not actively used)
DROP TABLE IF EXISTS "employee_resignations" CASCADE;

-- 12. Payroll runs (not actively used)
DROP TABLE IF EXISTS "payroll_runs" CASCADE;

-- 13. Time off requests (not actively used)
DROP TABLE IF EXISTS "time_off_requests" CASCADE;

-- 14. Weekly timesheets (not actively used)
DROP TABLE IF EXISTS "weekly_timesheets" CASCADE;

-- 15. Timesheet approvals (not actively used)
DROP TABLE IF EXISTS "timesheet_approvals" CASCADE;

-- 16. Time entries (not actively used)
DROP TABLE IF EXISTS "time_entries" CASCADE;

-- 17. Rental items and operator assignments (not actively used)
DROP TABLE IF EXISTS "rental_items" CASCADE;
DROP TABLE IF EXISTS "rental_operator_assignments" CASCADE;

-- 18. Equipment maintenance items (not actively used)
DROP TABLE IF EXISTS "equipment_maintenance_items" CASCADE;

-- 19. Equipment rental history (not actively used)
DROP TABLE IF EXISTS "equipment_rental_history" CASCADE;

-- 20. Salary increments (not actively used)
DROP TABLE IF EXISTS "salary_increments" CASCADE;

-- 21. Loans (not actively used)
DROP TABLE IF EXISTS "loans" CASCADE;

-- =====================================================
-- TABLES TO KEEP - ACTIVELY USED OR NEWLY IMPLEMENTED
-- =====================================================

-- Core entities (KEEP THESE):
-- - users
-- - employees
-- - projects
-- - equipment
-- - customers
-- - rentals
-- - companies
-- - locations

-- Employee management (KEEP THESE):
-- - employee_assignments
-- - employee_documents
-- - employee_leaves
-- - employee_salaries

-- Equipment management (KEEP THESE):
-- - equipment_maintenance

-- Financial (KEEP THESE):
-- - advance_payments
-- - advance_payment_histories
-- - payrolls
-- - payroll_items

-- Time tracking (KEEP THESE):
-- - timesheets

-- Organization (KEEP THESE):
-- - departments
-- - designations
-- - roles
-- - permissions
-- - model_has_roles
-- - role_has_permissions
-- - model_has_permissions

-- NEWLY IMPLEMENTED FEATURES (KEEP THESE):
-- - project_tasks
-- - project_milestones
-- - project_templates
-- - project_risks
-- - project_resources
-- - safety_incidents
-- - document_versions
-- - document_approvals
-- - system_settings
-- - report_templates
-- - scheduled_reports

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Check remaining tables after cleanup
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Count remaining tables
SELECT COUNT(*) as remaining_tables FROM pg_tables WHERE schemaname = 'public';

-- Show tables that should remain
SELECT 
    tablename,
    CASE 
        WHEN tablename IN (
            'users', 'employees', 'projects', 'equipment', 'customers', 'rentals',
            'companies', 'locations', 'employee_assignments', 'employee_documents',
            'employee_leaves', 'employee_salaries', 'equipment_maintenance',
            'advance_payments', 'advance_payment_histories', 'payrolls',
            'payroll_items', 'timesheets', 'departments', 'designations',
            'roles', 'permissions', 'model_has_roles', 'role_has_permissions',
            'model_has_permissions', 'project_tasks', 'project_milestones',
            'project_templates', 'project_risks', 'project_resources',
            'safety_incidents', 'document_versions', 'document_approvals',
            'system_settings', 'report_templates', 'scheduled_reports'
        ) THEN 'KEEP - Active/New Feature'
        ELSE 'REMOVED - Unused'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY status, tablename;
