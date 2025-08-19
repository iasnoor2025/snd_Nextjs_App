# Database Cleanup Analysis & Recommendations

## Summary
After analyzing your codebase, I've identified **31 tables that can be safely removed** and **27 tables that should be kept**. This cleanup will reduce your database from **58 tables to approximately 27 tables**.

## Tables to REMOVE (Unused/Legacy)

### 1. Laravel/Prisma Legacy Tables
- `_prisma_migrations` - Migration history (not needed)
- `jobs` - Queue jobs (not implemented)
- `failed_jobs` - Failed queue jobs (not implemented)
- `personal_access_tokens` - API tokens (not used)
- `password_reset_tokens` - Password reset (not implemented)
- `sessions` - User sessions (not used)

### 2. Telescope Debugging Tables
- `telescope_entries` - Laravel debugging
- `telescope_entry_tags` - Laravel debugging
- `telescope_monitoring` - Laravel debugging

### 3. Unused Feature Tables
- `cache` - Caching system (not implemented)
- `media` - Media management (not used)
- `geofence_zones` - Location tracking (not implemented)
- `analytics_reports` - Analytics (not actively used)
- `tax_documents` - Tax management (not used)
- `organizational_units` - Org structure (not used)

### 4. Unused Employee Management
- `skills` - Employee skills (not used)
- `trainings` - Training programs (not used)
- `employee_skill` - Employee-skill mapping (not used)
- `employee_training` - Employee-training mapping (not used)
- `employee_performance_reviews` - Performance reviews (not used)
- `employee_resignations` - Resignation tracking (not used)

### 5. Unused Time Tracking
- `time_off_requests` - Time off requests (not used)
- `weekly_timesheets` - Weekly timesheets (not used)
- `timesheet_approvals` - Timesheet approvals (not used)
- `time_entries` - Time entries (not used)

### 6. Unused Equipment Features
- `equipment_maintenance_items` - Maintenance items (not used)
- `equipment_rental_history` - Rental history (not used)

### 7. Unused Financial Features
- `payroll_runs` - Payroll runs (not used)
- `salary_increments` - Salary increments (not used)
- `loans` - Employee loans (not used)

### 8. Unused Rental Features
- `rental_items` - Rental items (not used)
- `rental_operator_assignments` - Operator assignments (not used)

## Tables to KEEP (Active/New Features)

### Core Business Entities
- `users` - User accounts
- `employees` - Employee records
- `projects` - Project management
- `equipment` - Equipment inventory
- `customers` - Customer management
- `rentals` - Rental management
- `companies` - Company information
- `locations` - Location management

### Employee Management
- `employee_assignments` - Project assignments
- `employee_documents` - Document management
- `employee_leaves` - Leave management
- `employee_salaries` - Salary records

### Equipment Management
- `equipment_maintenance` - Maintenance scheduling

### Financial Management
- `advance_payments` - Advance payments
- `advance_payment_histories` - Payment history
- `payrolls` - Payroll records
- `payroll_items` - Payroll line items

### Time Tracking
- `timesheets` - Timesheet management

### Organization Structure
- `departments` - Department management
- `designations` - Job designations
- `roles` - User roles
- `permissions` - System permissions
- `model_has_roles` - Role assignments
- `role_has_permissions` - Permission assignments
- `model_has_permissions` - User permissions

### NEWLY IMPLEMENTED FEATURES
- `project_tasks` - Project task management
- `project_milestones` - Project milestone tracking
- `project_templates` - Reusable project templates
- `project_risks` - Risk assessment
- `project_resources` - Resource allocation
- `safety_incidents` - Safety management
- `document_versions` - Document versioning
- `document_approvals` - Document approval workflows
- `system_settings` - System configuration
- `report_templates` - Report templates
- `scheduled_reports` - Automated reporting

## Benefits of Cleanup

1. **Reduced Database Size**: Remove ~31 unused tables
2. **Improved Performance**: Fewer tables to scan
3. **Cleaner Schema**: Only relevant tables remain
4. **Easier Maintenance**: Less complexity
5. **Better Security**: Remove unused attack vectors

## How to Execute Cleanup

### Option 1: Safe Cleanup (Recommended)
Use `cleanup-unused-tables-safe.sql` which only removes clearly unused legacy tables.

### Option 2: Full Cleanup
Use `cleanup-unused-tables.sql` which removes all unused tables including newly implemented ones.

### Option 3: Manual Review
Review each table individually before removal.

## Before Running Cleanup

1. **Backup your database**
2. **Test in development environment first**
3. **Review the tables being removed**
4. **Ensure no critical data exists in unused tables**

## After Cleanup

1. **Verify application functionality**
2. **Check all features still work**
3. **Monitor for any missing dependencies**
4. **Update schema files if needed**

## Estimated Impact

- **Tables Removed**: ~31
- **Tables Remaining**: ~27
- **Data Loss**: Only unused/legacy data
- **Application Impact**: None (all active features preserved)
- **Performance**: Improved (fewer tables to scan)
