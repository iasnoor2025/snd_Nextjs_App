-- Comprehensive Permissions for the Entire Application
-- This script creates all the permissions needed for the complete system

-- ===== CORE SYSTEM PERMISSIONS =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('manage.all', 'web', NOW(), NOW()),
('*', 'web', NOW(), NOW()),
('sync.all', 'web', NOW(), NOW()),
('reset.all', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== USER MANAGEMENT =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('create.User', 'web', NOW(), NOW()),
('read.User', 'web', NOW(), NOW()),
('update.User', 'web', NOW(), NOW()),
('delete.User', 'web', NOW(), NOW()),
('manage.User', 'web', NOW(), NOW()),
('create.Role', 'web', NOW(), NOW()),
('read.Role', 'web', NOW(), NOW()),
('update.Role', 'web', NOW(), NOW()),
('delete.Role', 'web', NOW(), NOW()),
('manage.Role', 'web', NOW(), NOW()),
('create.Permission', 'web', NOW(), NOW()),
('read.Permission', 'web', NOW(), NOW()),
('update.Permission', 'web', NOW(), NOW()),
('delete.Permission', 'web', NOW(), NOW()),
('manage.Permission', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== EMPLOYEE MANAGEMENT =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('create.Employee', 'web', NOW(), NOW()),
('read.Employee', 'web', NOW(), NOW()),
('update.Employee', 'web', NOW(), NOW()),
('delete.Employee', 'web', NOW(), NOW()),
('manage.Employee', 'web', NOW(), NOW()),
('create.employee-document', 'web', NOW(), NOW()),
('read.employee-document', 'web', NOW(), NOW()),
('update.employee-document', 'web', NOW(), NOW()),
('delete.employee-document', 'web', NOW(), NOW()),
('manage.employee-document', 'web', NOW(), NOW()),
('create.employee-assignment', 'web', NOW(), NOW()),
('read.employee-assignment', 'web', NOW(), NOW()),
('update.employee-assignment', 'web', NOW(), NOW()),
('delete.employee-assignment', 'web', NOW(), NOW()),
('manage.employee-assignment', 'web', NOW(), NOW()),
('create.employee-leave', 'web', NOW(), NOW()),
('read.employee-leave', 'web', NOW(), NOW()),
('update.employee-leave', 'web', NOW(), NOW()),
('delete.employee-leave', 'web', NOW(), NOW()),
('manage.employee-leave', 'web', NOW(), NOW()),
('create.employee-salary', 'web', NOW(), NOW()),
('read.employee-salary', 'web', NOW(), NOW()),
('update.employee-salary', 'web', NOW(), NOW()),
('delete.employee-salary', 'web', NOW(), NOW()),
('manage.employee-salary', 'web', NOW(), NOW()),
('create.employee-skill', 'web', NOW(), NOW()),
('read.employee-skill', 'web', NOW(), NOW()),
('update.employee-skill', 'web', NOW(), NOW()),
('delete.employee-skill', 'web', NOW(), NOW()),
('manage.employee-skill', 'web', NOW(), NOW()),
('create.employee-training', 'web', NOW(), NOW()),
('read.employee-training', 'web', NOW(), NOW()),
('update.employee-training', 'web', NOW(), NOW()),
('delete.employee-training', 'web', NOW(), NOW()),
('manage.employee-training', 'web', NOW(), NOW()),
('create.employee-performance', 'web', NOW(), NOW()),
('read.employee-performance', 'web', NOW(), NOW()),
('update.employee-performance', 'web', NOW(), NOW()),
('delete.employee-performance', 'web', NOW(), NOW()),
('manage.employee-performance', 'web', NOW(), NOW()),
('create.employee-resignation', 'web', NOW(), NOW()),
('read.employee-resignation', 'web', NOW(), NOW()),
('update.employee-resignation', 'web', NOW(), NOW()),
('delete.employee-resignation', 'web', NOW(), NOW()),
('manage.employee-resignation', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== CUSTOMER MANAGEMENT =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('create.Customer', 'web', NOW(), NOW()),
('read.Customer', 'web', NOW(), NOW()),
('update.Customer', 'web', NOW(), NOW()),
('delete.Customer', 'web', NOW(), NOW()),
('manage.Customer', 'web', NOW(), NOW()),
('create.customer-document', 'web', NOW(), NOW()),
('read.customer-document', 'web', NOW(), NOW()),
('update.customer-document', 'web', NOW(), NOW()),
('delete.customer-document', 'web', NOW(), NOW()),
('manage.customer-document', 'web', NOW(), NOW()),
('create.customer-project', 'web', NOW(), NOW()),
('read.customer-project', 'web', NOW(), NOW()),
('update.customer-project', 'web', NOW(), NOW()),
('delete.customer-project', 'web', NOW(), NOW()),
('manage.customer-project', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== EQUIPMENT MANAGEMENT =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('create.Equipment', 'web', NOW(), NOW()),
('read.Equipment', 'web', NOW(), NOW()),
('update.Equipment', 'web', NOW(), NOW()),
('delete.Equipment', 'web', NOW(), NOW()),
('manage.Equipment', 'web', NOW(), NOW()),
('create.equipment-rental', 'web', NOW(), NOW()),
('read.equipment-rental', 'web', NOW(), NOW()),
('update.equipment-rental', 'web', NOW(), NOW()),
('delete.equipment-rental', 'web', NOW(), NOW()),
('manage.equipment-rental', 'web', NOW(), NOW()),
('create.equipment-maintenance', 'web', NOW(), NOW()),
('read.equipment-maintenance', 'web', NOW(), NOW()),
('update.equipment-maintenance', 'web', NOW(), NOW()),
('delete.equipment-maintenance', 'web', NOW(), NOW()),
('manage.equipment-maintenance', 'web', NOW(), NOW()),
('create.equipment-history', 'web', NOW(), NOW()),
('read.equipment-history', 'web', NOW(), NOW()),
('update.equipment-history', 'web', NOW(), NOW()),
('delete.equipment-history', 'web', NOW(), NOW()),
('manage.equipment-history', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== MAINTENANCE MANAGEMENT =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('create.Maintenance', 'web', NOW(), NOW()),
('read.Maintenance', 'web', NOW(), NOW()),
('update.Maintenance', 'web', NOW(), NOW()),
('delete.Maintenance', 'web', NOW(), NOW()),
('manage.Maintenance', 'web', NOW(), NOW()),
('create.maintenance-item', 'web', NOW(), NOW()),
('read.maintenance-item', 'web', NOW(), NOW()),
('update.maintenance-item', 'web', NOW(), NOW()),
('delete.maintenance-item', 'web', NOW(), NOW()),
('manage.maintenance-item', 'web', NOW(), NOW()),
('create.maintenance-schedule', 'web', NOW(), NOW()),
('read.maintenance-schedule', 'web', NOW(), NOW()),
('update.maintenance-schedule', 'web', NOW(), NOW()),
('delete.maintenance-schedule', 'web', NOW(), NOW()),
('manage.maintenance-schedule', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== RENTAL MANAGEMENT =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('create.Rental', 'web', NOW(), NOW()),
('read.Rental', 'web', NOW(), NOW()),
('update.Rental', 'web', NOW(), NOW()),
('delete.Rental', 'web', NOW(), NOW()),
('manage.Rental', 'web', NOW(), NOW()),
('create.rental-item', 'web', NOW(), NOW()),
('read.rental-item', 'web', NOW(), NOW()),
('update.rental-item', 'web', NOW(), NOW()),
('delete.rental-item', 'web', NOW(), NOW()),
('manage.rental-item', 'web', NOW(), NOW()),
('create.rental-history', 'web', NOW(), NOW()),
('read.rental-history', 'web', NOW(), NOW()),
('update.rental-history', 'web', NOW(), NOW()),
('delete.rental-history', 'web', NOW(), NOW()),
('manage.rental-history', 'web', NOW(), NOW()),
('create.rental-contract', 'web', NOW(), NOW()),
('read.rental-contract', 'web', NOW(), NOW()),
('update.rental-contract', 'web', NOW(), NOW()),
('delete.rental-contract', 'web', NOW(), NOW()),
('manage.rental-contract', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== QUOTATION MANAGEMENT =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('create.Quotation', 'web', NOW(), NOW()),
('read.Quotation', 'web', NOW(), NOW()),
('update.Quotation', 'web', NOW(), NOW()),
('delete.Quotation', 'web', NOW(), NOW()),
('manage.Quotation', 'web', NOW(), NOW()),
('create.quotation-term', 'web', NOW(), NOW()),
('read.quotation-term', 'web', NOW(), NOW()),
('update.quotation-term', 'web', NOW(), NOW()),
('delete.quotation-term', 'web', NOW(), NOW()),
('manage.quotation-term', 'web', NOW(), NOW()),
('create.quotation-item', 'web', NOW(), NOW()),
('read.quotation-item', 'web', NOW(), NOW()),
('update.quotation-item', 'web', NOW(), NOW()),
('delete.quotation-item', 'web', NOW(), NOW()),
('manage.quotation-item', 'web', NOW(), NOW()),
('approve.Quotation', 'web', NOW(), NOW()),
('reject.Quotation', 'web', NOW(), NOW()),
('send.Quotation', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== PAYROLL MANAGEMENT =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('create.Payroll', 'web', NOW(), NOW()),
('read.Payroll', 'web', NOW(), NOW()),
('update.Payroll', 'web', NOW(), NOW()),
('delete.Payroll', 'web', NOW(), NOW()),
('manage.Payroll', 'web', NOW(), NOW()),
('create.payroll-item', 'web', NOW(), NOW()),
('read.payroll-item', 'web', NOW(), NOW()),
('update.payroll-item', 'web', NOW(), NOW()),
('delete.payroll-item', 'web', NOW(), NOW()),
('manage.payroll-item', 'web', NOW(), NOW()),
('create.payroll-run', 'web', NOW(), NOW()),
('read.payroll-run', 'web', NOW(), NOW()),
('update.payroll-run', 'web', NOW(), NOW()),
('delete.payroll-run', 'web', NOW(), NOW()),
('manage.payroll-run', 'web', NOW(), NOW()),
('create.tax-document', 'web', NOW(), NOW()),
('read.tax-document', 'web', NOW(), NOW()),
('update.tax-document', 'web', NOW(), NOW()),
('delete.tax-document', 'web', NOW(), NOW()),
('manage.tax-document', 'web', NOW(), NOW()),
('approve.Payroll', 'web', NOW(), NOW()),
('reject.Payroll', 'web', NOW(), NOW()),
('process.Payroll', 'web', NOW(), NOW()),
('export.Payroll', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== TIMESHEET MANAGEMENT =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('create.Timesheet', 'web', NOW(), NOW()),
('read.Timesheet', 'web', NOW(), NOW()),
('update.Timesheet', 'web', NOW(), NOW()),
('delete.Timesheet', 'web', NOW(), NOW()),
('manage.Timesheet', 'web', NOW(), NOW()),
('create.time-entry', 'web', NOW(), NOW()),
('read.time-entry', 'web', NOW(), NOW()),
('update.time-entry', 'web', NOW(), NOW()),
('delete.time-entry', 'web', NOW(), NOW()),
('manage.time-entry', 'web', NOW(), NOW()),
('create.weekly-timesheet', 'web', NOW(), NOW()),
('read.weekly-timesheet', 'web', NOW(), NOW()),
('update.weekly-timesheet', 'web', NOW(), NOW()),
('delete.weekly-timesheet', 'web', NOW(), NOW()),
('manage.weekly-timesheet', 'web', NOW(), NOW()),
('create.timesheet-approval', 'web', NOW(), NOW()),
('read.timesheet-approval', 'web', NOW(), NOW()),
('update.timesheet-approval', 'web', NOW(), NOW()),
('delete.timesheet-approval', 'web', NOW(), NOW()),
('manage.timesheet-approval', 'web', NOW(), NOW()),
('approve.Timesheet', 'web', NOW(), NOW()),
('reject.Timesheet', 'web', NOW(), NOW()),
('bulk-approve.Timesheet', 'web', NOW(), NOW()),
('mark-absent.Timesheet', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== PROJECT MANAGEMENT =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('create.Project', 'web', NOW(), NOW()),
('read.Project', 'web', NOW(), NOW()),
('update.Project', 'web', NOW(), NOW()),
('delete.Project', 'web', NOW(), NOW()),
('manage.Project', 'web', NOW(), NOW()),
('create.project-task', 'web', NOW(), NOW()),
('read.project-task', 'web', NOW(), NOW()),
('update.project-task', 'web', NOW(), NOW()),
('delete.project-task', 'web', NOW(), NOW()),
('manage.project-task', 'web', NOW(), NOW()),
('create.project-milestone', 'web', NOW(), NOW()),
('read.project-milestone', 'web', NOW(), NOW()),
('update.project-milestone', 'web', NOW(), NOW()),
('delete.project-milestone', 'web', NOW(), NOW()),
('manage.project-milestone', 'web', NOW(), NOW()),
('create.project-template', 'web', NOW(), NOW()),
('read.project-template', 'web', NOW(), NOW()),
('update.project-template', 'web', NOW(), NOW()),
('delete.project-template', 'web', NOW(), NOW()),
('manage.project-template', 'web', NOW(), NOW()),
('create.project-risk', 'web', NOW(), NOW()),
('read.project-risk', 'web', NOW(), NOW()),
('update.project-risk', 'web', NOW(), NOW()),
('delete.project-risk', 'web', NOW(), NOW()),
('manage.project-risk', 'web', NOW(), NOW()),
('create.project-manpower', 'web', NOW(), NOW()),
('read.project-manpower', 'web', NOW(), NOW()),
('update.project-manpower', 'web', NOW(), NOW()),
('delete.project-manpower', 'web', NOW(), NOW()),
('manage.project-manpower', 'web', NOW(), NOW()),
('create.project-equipment', 'web', NOW(), NOW()),
('read.project-equipment', 'web', NOW(), NOW()),
('update.project-equipment', 'web', NOW(), NOW()),
('delete.project-equipment', 'web', NOW(), NOW()),
('manage.project-equipment', 'web', NOW(), NOW()),
('create.project-material', 'web', NOW(), NOW()),
('read.project-material', 'web', NOW(), NOW()),
('update.project-material', 'web', NOW(), NOW()),
('delete.project-material', 'web', NOW(), NOW()),
('manage.project-material', 'web', NOW(), NOW()),
('create.project-fuel', 'web', NOW(), NOW()),
('read.project-fuel', 'web', NOW(), NOW()),
('update.project-fuel', 'web', NOW(), NOW()),
('delete.project-fuel', 'web', NOW(), NOW()),
('manage.project-fuel', 'web', NOW(), NOW()),
('create.project-expense', 'web', NOW(), NOW()),
('read.project-expense', 'web', NOW(), NOW()),
('update.project-expense', 'web', NOW(), NOW()),
('delete.project-expense', 'web', NOW(), NOW()),
('manage.project-expense', 'web', NOW(), NOW()),
('create.project-subcontractor', 'web', NOW(), NOW()),
('read.project-subcontractor', 'web', NOW(), NOW()),
('update.project-subcontractor', 'web', NOW(), NOW()),
('delete.project-subcontractor', 'web', NOW(), NOW()),
('manage.project-subcontractor', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== LEAVE MANAGEMENT =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('create.Leave', 'web', NOW(), NOW()),
('read.Leave', 'web', NOW(), NOW()),
('update.Leave', 'web', NOW(), NOW()),
('delete.Leave', 'web', NOW(), NOW()),
('manage.Leave', 'web', NOW(), NOW()),
('create.time-off-request', 'web', NOW(), NOW()),
('read.time-off-request', 'web', NOW(), NOW()),
('update.time-off-request', 'web', NOW(), NOW()),
('delete.time-off-request', 'web', NOW(), NOW()),
('manage.time-off-request', 'web', NOW(), NOW()),
('approve.Leave', 'web', NOW(), NOW()),
('reject.Leave', 'web', NOW(), NOW()),
('cancel.Leave', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== DEPARTMENT & ORGANIZATION =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('create.Department', 'web', NOW(), NOW()),
('read.Department', 'web', NOW(), NOW()),
('update.Department', 'web', NOW(), NOW()),
('delete.Department', 'web', NOW(), NOW()),
('manage.Department', 'web', NOW(), NOW()),
('create.Designation', 'web', NOW(), NOW()),
('read.Designation', 'web', NOW(), NOW()),
('update.Designation', 'web', NOW(), NOW()),
('delete.Designation', 'web', NOW(), NOW()),
('manage.Designation', 'web', NOW(), NOW()),
('create.organizational-unit', 'web', NOW(), NOW()),
('read.organizational-unit', 'web', NOW(), NOW()),
('update.organizational-unit', 'web', NOW(), NOW()),
('delete.organizational-unit', 'web', NOW(), NOW()),
('manage.organizational-unit', 'web', NOW(), NOW()),
('create.Skill', 'web', NOW(), NOW()),
('read.Skill', 'web', NOW(), NOW()),
('update.Skill', 'web', NOW(), NOW()),
('delete.Skill', 'web', NOW(), NOW()),
('manage.Skill', 'web', NOW(), NOW()),
('create.Training', 'web', NOW(), NOW()),
('read.Training', 'web', NOW(), NOW()),
('update.Training', 'web', NOW(), NOW()),
('delete.Training', 'web', NOW(), NOW()),
('manage.Training', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== COMPANY MANAGEMENT =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('create.Company', 'web', NOW(), NOW()),
('read.Company', 'web', NOW(), NOW()),
('update.Company', 'web', NOW(), NOW()),
('delete.Company', 'web', NOW(), NOW()),
('manage.Company', 'web', NOW(), NOW()),
('create.company-document', 'web', NOW(), NOW()),
('read.company-document', 'web', NOW(), NOW()),
('update.company-document', 'web', NOW(), NOW()),
('delete.company-document', 'web', NOW(), NOW()),
('manage.company-document', 'web', NOW(), NOW()),
('create.company-document-type', 'web', NOW(), NOW()),
('read.company-document-type', 'web', NOW(), NOW()),
('update.company-document-type', 'web', NOW(), NOW()),
('delete.company-document-type', 'web', NOW(), NOW()),
('manage.company-document-type', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== SETTINGS & CONFIGURATION =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('create.Settings', 'web', NOW(), NOW()),
('read.Settings', 'web', NOW(), NOW()),
('update.Settings', 'web', NOW(), NOW()),
('delete.Settings', 'web', NOW(), NOW()),
('manage.Settings', 'web', NOW(), NOW()),
('create.system-setting', 'web', NOW(), NOW()),
('read.system-setting', 'web', NOW(), NOW()),
('update.system-setting', 'web', NOW(), NOW()),
('delete.system-setting', 'web', NOW(), NOW()),
('manage.system-setting', 'web', NOW(), NOW()),
('create.country', 'web', NOW(), NOW()),
('read.country', 'web', NOW(), NOW()),
('update.country', 'web', NOW(), NOW()),
('delete.country', 'web', NOW(), NOW()),
('manage.country', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== REPORTING & ANALYTICS =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('create.Report', 'web', NOW(), NOW()),
('read.Report', 'web', NOW(), NOW()),
('update.Report', 'web', NOW(), NOW()),
('delete.Report', 'web', NOW(), NOW()),
('manage.Report', 'web', NOW(), NOW()),
('create.report-template', 'web', NOW(), NOW()),
('read.report-template', 'web', NOW(), NOW()),
('update.report-template', 'web', NOW(), NOW()),
('delete.report-template', 'web', NOW(), NOW()),
('manage.report-template', 'web', NOW(), NOW()),
('create.scheduled-report', 'web', NOW(), NOW()),
('read.scheduled-report', 'web', NOW(), NOW()),
('update.scheduled-report', 'web', NOW(), NOW()),
('delete.scheduled-report', 'web', NOW(), NOW()),
('manage.scheduled-report', 'web', NOW(), NOW()),
('create.analytics-report', 'web', NOW(), NOW()),
('read.analytics-report', 'web', NOW(), NOW()),
('update.analytics-report', 'web', NOW(), NOW()),
('delete.analytics-report', 'web', NOW(), NOW()),
('manage.analytics-report', 'web', NOW(), NOW()),
('export.Report', 'web', NOW(), NOW()),
('import.Report', 'web', NOW(), NOW()),
('schedule.Report', 'web', NOW(), NOW()),
('generate.Report', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== SAFETY MANAGEMENT =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('create.Safety', 'web', NOW(), NOW()),
('read.Safety', 'web', NOW(), NOW()),
('update.Safety', 'web', NOW(), NOW()),
('delete.Safety', 'web', NOW(), NOW()),
('manage.Safety', 'web', NOW(), NOW()),
('create.safety-incident', 'web', NOW(), NOW()),
('read.safety-incident', 'web', NOW(), NOW()),
('update.safety-incident', 'web', NOW(), NOW()),
('delete.safety-incident', 'web', NOW(), NOW()),
('manage.safety-incident', 'web', NOW(), NOW()),
('create.safety-report', 'web', NOW(), NOW()),
('read.safety-report', 'web', NOW(), NOW()),
('update.safety-report', 'web', NOW(), NOW()),
('delete.safety-report', 'web', NOW(), NOW()),
('manage.safety-report', 'web', NOW(), NOW()),
('approve.Safety', 'web', NOW(), NOW()),
('investigate.Safety', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== SALARY & COMPENSATION =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('create.SalaryIncrement', 'web', NOW(), NOW()),
('read.SalaryIncrement', 'web', NOW(), NOW()),
('update.SalaryIncrement', 'web', NOW(), NOW()),
('delete.SalaryIncrement', 'web', NOW(), NOW()),
('manage.SalaryIncrement', 'web', NOW(), NOW()),
('create.advance-payment', 'web', NOW(), NOW()),
('read.advance-payment', 'web', NOW(), NOW()),
('update.advance-payment', 'web', NOW(), NOW()),
('delete.advance-payment', 'web', NOW(), NOW()),
('manage.advance-payment', 'web', NOW(), NOW()),
('create.loan', 'web', NOW(), NOW()),
('read.loan', 'web', NOW(), NOW()),
('update.loan', 'web', NOW(), NOW()),
('delete.loan', 'web', NOW(), NOW()),
('manage.loan', 'web', NOW(), NOW()),
('approve.SalaryIncrement', 'web', NOW(), NOW()),
('reject.SalaryIncrement', 'web', NOW(), NOW()),
('apply.SalaryIncrement', 'web', NOW(), NOW()),
('approve.advance-payment', 'web', NOW(), NOW()),
('reject.advance-payment', 'web', NOW(), NOW()),
('process.advance-payment', 'web', NOW(), NOW()),
('approve.loan', 'web', NOW(), NOW()),
('reject.loan', 'web', NOW(), NOW()),
('process.loan', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== ANALYTICS & DASHBOARD =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('read.Analytics', 'web', NOW(), NOW()),
('export.Analytics', 'web', NOW(), NOW()),
('create.Analytics', 'web', NOW(), NOW()),
('update.Analytics', 'web', NOW(), NOW()),
('delete.Analytics', 'web', NOW(), NOW()),
('manage.Analytics', 'web', NOW(), NOW()),
('read.Dashboard', 'web', NOW(), NOW()),
('export.Dashboard', 'web', NOW(), NOW()),
('customize.Dashboard', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== NOTIFICATIONS & COMMUNICATION =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('read.Notification', 'web', NOW(), NOW()),
('manage.Notification', 'web', NOW(), NOW()),
('create.Notification', 'web', NOW(), NOW()),
('update.Notification', 'web', NOW(), NOW()),
('delete.Notification', 'web', NOW(), NOW()),
('send.Notification', 'web', NOW(), NOW()),
('read.notification-template', 'web', NOW(), NOW()),
('manage.notification-template', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== LOCATION & GEOGRAPHY =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('create.Location', 'web', NOW(), NOW()),
('read.Location', 'web', NOW(), NOW()),
('update.Location', 'web', NOW(), NOW()),
('delete.Location', 'web', NOW(), NOW()),
('manage.Location', 'web', NOW(), NOW()),
('create.geofence-zone', 'web', NOW(), NOW()),
('read.geofence-zone', 'web', NOW(), NOW()),
('update.geofence-zone', 'web', NOW(), NOW()),
('delete.geofence-zone', 'web', NOW(), NOW()),
('manage.geofence-zone', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== DOCUMENT MANAGEMENT =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('create.Document', 'web', NOW(), NOW()),
('read.Document', 'web', NOW(), NOW()),
('update.Document', 'web', NOW(), NOW()),
('delete.Document', 'web', NOW(), NOW()),
('manage.Document', 'web', NOW(), NOW()),
('create.document-version', 'web', NOW(), NOW()),
('read.document-version', 'web', NOW(), NOW()),
('update.document-version', 'web', NOW(), NOW()),
('delete.document-version', 'web', NOW(), NOW()),
('manage.document-version', 'web', NOW(), NOW()),
('create.document-approval', 'web', NOW(), NOW()),
('read.document-approval', 'web', NOW(), NOW()),
('update.document-approval', 'web', NOW(), NOW()),
('delete.document-approval', 'web', NOW(), NOW()),
('manage.document-approval', 'web', NOW(), NOW()),
('upload.Document', 'web', NOW(), NOW()),
('download.Document', 'web', NOW(), NOW()),
('approve.Document', 'web', NOW(), NOW()),
('reject.Document', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== ASSIGNMENT & RESOURCE MANAGEMENT =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('create.Assignment', 'web', NOW(), NOW()),
('read.Assignment', 'web', NOW(), NOW()),
('update.Assignment', 'web', NOW(), NOW()),
('delete.Assignment', 'web', NOW(), NOW()),
('manage.Assignment', 'web', NOW(), NOW()),
('create.resource-allocation', 'web', NOW(), NOW()),
('read.resource-allocation', 'web', NOW(), NOW()),
('update.resource-allocation', 'web', NOW(), NOW()),
('delete.resource-allocation', 'web', NOW(), NOW()),
('manage.resource-allocation', 'web', NOW(), NOW()),
('approve.Assignment', 'web', NOW(), NOW()),
('reject.Assignment', 'web', NOW(), NOW()),
('assign.Assignment', 'web', NOW(), NOW()),
('unassign.Assignment', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== ADVANCE & FINANCIAL MANAGEMENT =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('create.Advance', 'web', NOW(), NOW()),
('read.Advance', 'web', NOW(), NOW()),
('update.Advance', 'web', NOW(), NOW()),
('delete.Advance', 'web', NOW(), NOW()),
('manage.Advance', 'web', NOW(), NOW()),
('create.advance-history', 'web', NOW(), NOW()),
('read.advance-history', 'web', NOW(), NOW()),
('update.advance-history', 'web', NOW(), NOW()),
('delete.advance-history', 'web', NOW(), NOW()),
('manage.advance-history', 'web', NOW(), NOW()),
('approve.Advance', 'web', NOW(), NOW()),
('reject.Advance', 'web', NOW(), NOW()),
('process.Advance', 'web', NOW(), NOW()),
('repay.Advance', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== PERFORMANCE & REVIEWS =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('create.performance-review', 'web', NOW(), NOW()),
('read.performance-review', 'web', NOW(), NOW()),
('update.performance-review', 'web', NOW(), NOW()),
('delete.performance-review', 'web', NOW(), NOW()),
('manage.performance-review', 'web', NOW(), NOW()),
('create.performance-goal', 'web', NOW(), NOW()),
('read.performance-goal', 'web', NOW(), NOW()),
('update.performance-goal', 'web', NOW(), NOW()),
('delete.performance-goal', 'web', NOW(), NOW()),
('manage.performance-goal', 'web', NOW(), NOW()),
('approve.performance-review', 'web', NOW(), NOW()),
('conduct.performance-review', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== UPLOAD & FILE MANAGEMENT =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('upload.file', 'web', NOW(), NOW()),
('download.file', 'web', NOW(), NOW()),
('delete.file', 'web', NOW(), NOW()),
('manage.file', 'web', NOW(), NOW()),
('upload.image', 'web', NOW(), NOW()),
('upload.document', 'web', NOW(), NOW()),
('upload.video', 'web', NOW(), NOW()),
('upload.audio', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== WEBHOOK & INTEGRATION =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('create.webhook', 'web', NOW(), NOW()),
('read.webhook', 'web', NOW(), NOW()),
('update.webhook', 'web', NOW(), NOW()),
('delete.webhook', 'web', NOW(), NOW()),
('manage.webhook', 'web', NOW(), NOW()),
('create.integration', 'web', NOW(), NOW()),
('read.integration', 'web', NOW(), NOW()),
('update.integration', 'web', NOW(), NOW()),
('delete.integration', 'web', NOW(), NOW()),
('manage.integration', 'web', NOW(), NOW()),
('sync.external-system', 'web', NOW(), NOW()),
('webhook.receive', 'web', NOW(), NOW()),
('webhook.send', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== CRON & SCHEDULED TASKS =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('create.cron-job', 'web', NOW(), NOW()),
('read.cron-job', 'web', NOW(), NOW()),
('update.cron-job', 'web', NOW(), NOW()),
('delete.cron-job', 'web', NOW(), NOW()),
('manage.cron-job', 'web', NOW(), NOW()),
('create.scheduled-task', 'web', NOW(), NOW()),
('read.scheduled-task', 'web', NOW(), NOW()),
('update.scheduled-task', 'web', NOW(), NOW()),
('delete.scheduled-task', 'web', NOW(), NOW()),
('manage.scheduled-task', 'web', NOW(), NOW()),
('execute.cron-job', 'web', NOW(), NOW()),
('schedule.task', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== ADMIN & SYSTEM OPERATIONS =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('admin.reset-database', 'web', NOW(), NOW()),
('admin.migrate-data', 'web', NOW(), NOW()),
('admin.backup-data', 'web', NOW(), NOW()),
('admin.restore-data', 'web', NOW(), NOW()),
('admin.system-health', 'web', NOW(), NOW()),
('admin.performance-monitor', 'web', NOW(), NOW()),
('admin.log-viewer', 'web', NOW(), NOW()),
('admin.cache-manager', 'web', NOW(), NOW()),
('admin.user-sessions', 'web', NOW(), NOW()),
('admin.audit-logs', 'web', NOW(), NOW()),
('admin.system-settings', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== ERP & EXTERNAL INTEGRATIONS =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('erp.sync-customers', 'web', NOW(), NOW()),
('erp.sync-employees', 'web', NOW(), NOW()),
('erp.sync-projects', 'web', NOW(), NOW()),
('erp.sync-inventory', 'web', NOW(), NOW()),
('erp.export-data', 'web', NOW(), NOW()),
('erp.import-data', 'web', NOW(), NOW()),
('erp.validate-connection', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== TRANSLATION & LOCALIZATION =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('translate.content', 'web', NOW(), NOW()),
('manage.translations', 'web', NOW(), NOW()),
('create.language', 'web', NOW(), NOW()),
('update.language', 'web', NOW(), NOW()),
('delete.language', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== PROFILE & PERSONAL SETTINGS =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('read.own-profile', 'web', NOW(), NOW()),
('update.own-profile', 'web', NOW(), NOW()),
('change.own-password', 'web', NOW(), NOW()),
('manage.own-preferences', 'web', NOW(), NOW()),
('read.own-timesheet', 'web', NOW(), NOW()),
('update.own-timesheet', 'web', NOW(), NOW()),
('submit.own-timesheet', 'web', NOW(), NOW()),
('read.own-leave', 'web', NOW(), NOW()),
('request.own-leave', 'web', NOW(), NOW()),
('cancel.own-leave', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== EMPLOYEE DASHBOARD =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('read.employee-dashboard', 'web', NOW(), NOW()),
('customize.employee-dashboard', 'web', NOW(), NOW()),
('export.employee-data', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== SPECIAL OPERATIONS =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('bulk.operations', 'web', NOW(), NOW()),
('mass.update', 'web', NOW(), NOW()),
('mass.delete', 'web', NOW(), NOW()),
('mass.import', 'web', NOW(), NOW()),
('mass.export', 'web', NOW(), NOW()),
('override.permissions', 'web', NOW(), NOW()),
('bypass.security', 'web', NOW(), NOW()),
('emergency.access', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== AUDIT & COMPLIANCE =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('audit.read-logs', 'web', NOW(), NOW()),
('audit.export-logs', 'web', NOW(), NOW()),
('audit.delete-logs', 'web', NOW(), NOW()),
('compliance.report', 'web', NOW(), NOW()),
('gdpr.export-data', 'web', NOW(), NOW()),
('gdpr.delete-data', 'web', NOW(), NOW()),
('gdpr.anonymize-data', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ===== BACKUP & RECOVERY =====
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('backup.create', 'web', NOW(), NOW()),
('backup.restore', 'web', NOW(), NOW()),
('backup.download', 'web', NOW(), NOW()),
('backup.delete', 'web', NOW(), NOW()),
('backup.schedule', 'web', NOW(), NOW()),
('recovery.initiate', 'web', NOW(), NOW()),
('recovery.monitor', 'web', NOW(), NOW()),
('recovery.rollback', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Show final count
SELECT 
    'Total Permissions Created' as status,
    COUNT(*) as count
FROM permissions;
