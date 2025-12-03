-- Remove unused tables for performance optimization
-- This migration removes tables that are not actively used in the application

-- Remove analytics_reports table (not used)
DROP TABLE IF EXISTS analytics_reports CASCADE;

-- Remove cache table (not used in current implementation)
DROP TABLE IF EXISTS cache CASCADE;

-- Remove media table (appears to be unused)
DROP TABLE IF EXISTS media CASCADE;

-- Remove geofence_zones table (not implemented)
DROP TABLE IF EXISTS geofence_zones CASCADE;

-- Remove tax_documents tables (not actively used)
DROP TABLE IF EXISTS tax_documents CASCADE;
DROP TABLE IF EXISTS tax_document_payrolls CASCADE;

-- Remove organizational_units table (not actively used)
DROP TABLE IF EXISTS organizational_units CASCADE;

-- Remove skills and trainings tables (not actively used)
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS trainings CASCADE;
DROP TABLE IF EXISTS employee_skill CASCADE;
DROP TABLE IF EXISTS employee_training CASCADE;

-- Remove employee performance reviews table (not actively used)
DROP TABLE IF EXISTS employee_performance_reviews CASCADE;

-- Remove employee resignations table (not actively used)
DROP TABLE IF EXISTS employee_resignations CASCADE;

-- Remove payroll_runs table (not actively used)
DROP TABLE IF EXISTS payroll_runs CASCADE;

-- Remove time off requests table (not actively used)
DROP TABLE IF EXISTS time_off_requests CASCADE;

-- Remove weekly timesheets table (not actively used)
DROP TABLE IF EXISTS weekly_timesheets CASCADE;

-- Remove timesheet approvals table (not actively used)
DROP TABLE IF EXISTS timesheet_approvals CASCADE;

-- Remove time entries table (not actively used)
DROP TABLE IF EXISTS time_entries CASCADE;

-- Remove rental items and operator assignments tables (not actively used)
DROP TABLE IF EXISTS rental_items CASCADE;
DROP TABLE IF EXISTS rental_operator_assignments CASCADE;

-- Remove equipment maintenance items table (not actively used)
DROP TABLE IF EXISTS equipment_maintenance_items CASCADE;

-- Remove equipment rental history table (not actively used)
DROP TABLE IF EXISTS equipment_rental_history CASCADE;

-- Remove salary increments table (not actively used)
DROP TABLE IF EXISTS salary_increments CASCADE;

-- Remove loans table (not actively used)
DROP TABLE IF EXISTS loans CASCADE;

-- Remove system settings table (not implemented)
DROP TABLE IF EXISTS system_settings CASCADE;

-- Remove project related tables (not implemented)
DROP TABLE IF EXISTS project_risks CASCADE;
DROP TABLE IF EXISTS project_templates CASCADE;
DROP TABLE IF EXISTS project_milestones CASCADE;
DROP TABLE IF EXISTS project_tasks CASCADE;
DROP TABLE IF EXISTS project_resources CASCADE;

-- Remove report templates and scheduled reports tables (not implemented)
DROP TABLE IF EXISTS report_templates CASCADE;
DROP TABLE IF EXISTS scheduled_reports CASCADE;

-- Remove document approvals table (not implemented)
DROP TABLE IF EXISTS document_approvals CASCADE;

-- Remove Laravel/Prisma specific tables (not used in Next.js app)
DROP TABLE IF EXISTS _prisma_migrations CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS failed_jobs CASCADE;
DROP TABLE IF EXISTS personal_access_tokens CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- Remove Telescope monitoring tables (Laravel debugging - not used)
DROP TABLE IF EXISTS telescope_entries CASCADE;
DROP TABLE IF EXISTS telescope_entry_tags CASCADE;
DROP TABLE IF EXISTS telescope_monitoring CASCADE;
