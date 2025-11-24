-- Database Cleanup Script for Unused Tables
-- This script identifies and removes tables that are not being used in the application

-- WARNING: This will permanently delete data and tables
-- Please backup your database before running this script
-- Review each table carefully before deletion

-- =====================================================
-- TABLES THAT APPEAR TO BE UNUSED (NOT IMPORTED IN CODE)
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

-- 7. Report templates and scheduled reports (not implemented)
DROP TABLE IF EXISTS "report_templates" CASCADE;
DROP TABLE IF EXISTS "scheduled_reports" CASCADE;

-- 8. Document approvals (not implemented)
DROP TABLE IF EXISTS "document_approvals" CASCADE;

-- 9. Tax documents (not actively used)
DROP TABLE IF EXISTS "tax_documents" CASCADE;
DROP TABLE IF EXISTS "tax_document_payrolls" CASCADE;

-- 10. Organizational units (not actively used)
DROP TABLE IF EXISTS "organizational_units" CASCADE;

-- 11. Skills and trainings (not actively used)
DROP TABLE IF EXISTS "skills" CASCADE;
DROP TABLE IF EXISTS "trainings" CASCADE;
DROP TABLE IF EXISTS "employee_skill" CASCADE;
DROP TABLE IF EXISTS "employee_training" CASCADE;

-- 12. Employee performance reviews (not actively used)
DROP TABLE IF EXISTS "employee_performance_reviews" CASCADE;

-- 13. Employee resignations (not actively used)
DROP TABLE IF EXISTS "employee_resignations" CASCADE;

-- 14. Payroll runs (not actively used)
DROP TABLE IF EXISTS "payroll_runs" CASCADE;

-- 15. Time off requests (not actively used)
DROP TABLE IF EXISTS "time_off_requests" CASCADE;

-- 16. Weekly timesheets (not actively used)
DROP TABLE IF EXISTS "weekly_timesheets" CASCADE;

-- 17. Timesheet approvals (not actively used)
DROP TABLE IF EXISTS "timesheet_approvals" CASCADE;

-- 18. Time entries (not actively used)
DROP TABLE IF EXISTS "time_entries" CASCADE;

-- 19. Rental items and operator assignments (not actively used)
DROP TABLE IF EXISTS "rental_items" CASCADE;
DROP TABLE IF EXISTS "rental_operator_assignments" CASCADE;

-- 20. Equipment maintenance items (not actively used)
DROP TABLE IF EXISTS "equipment_maintenance_items" CASCADE;

-- 21. Equipment rental history (not actively used)
DROP TABLE IF EXISTS "equipment_rental_history" CASCADE;

-- 22. Salary increments (not actively used)
DROP TABLE IF EXISTS "salary_increments" CASCADE;

-- 23. Loans (not actively used)
DROP TABLE IF EXISTS "loans" CASCADE;

-- 24. System settings (not implemented)
DROP TABLE IF EXISTS "system_settings" CASCADE;

-- 25. Project risks (not implemented)
DROP TABLE IF EXISTS "project_risks" CASCADE;

-- 26. Project templates (not implemented)
DROP TABLE IF EXISTS "project_templates" CASCADE;

-- 27. Project milestones (not implemented)
DROP TABLE IF EXISTS "project_milestones" CASCADE;

-- 28. Project tasks (not implemented)
DROP TABLE IF EXISTS "project_tasks" CASCADE;

-- 29. Project resources (not implemented)
DROP TABLE IF EXISTS "project_resources" CASCADE;

-- 30. Safety incidents (not implemented)
DROP TABLE IF EXISTS "safety_incidents" CASCADE;

-- 31. Document versions (not implemented)
DROP TABLE IF EXISTS "document_versions" CASCADE;

-- =====================================================
-- TABLES TO KEEP (ACTIVELY USED IN APPLICATION)
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
