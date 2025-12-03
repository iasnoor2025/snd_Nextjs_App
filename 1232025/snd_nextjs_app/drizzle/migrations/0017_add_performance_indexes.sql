-- Add performance indexes for better query performance
-- These indexes will significantly improve query speed without breaking existing functionality

-- Employee-related indexes
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_designation_id ON employees(designation_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_hire_date ON employees(hire_date);
CREATE INDEX IF NOT EXISTS idx_employees_iqama_expiry ON employees(iqama_expiry_date);

-- Rental-related indexes
CREATE INDEX IF NOT EXISTS idx_rentals_customer_id ON rentals(customer_id);
CREATE INDEX IF NOT EXISTS idx_rentals_project_id ON rentals(project_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
CREATE INDEX IF NOT EXISTS idx_rentals_start_date ON rentals(start_date);
CREATE INDEX IF NOT EXISTS idx_rentals_payment_status ON rentals(payment_status);

-- Timesheet-related indexes
CREATE INDEX IF NOT EXISTS idx_timesheets_employee_id ON timesheets(employee_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_date ON timesheets(date);
CREATE INDEX IF NOT EXISTS idx_timesheets_status ON timesheets(status);
CREATE INDEX IF NOT EXISTS idx_timesheets_employee_date ON timesheets(employee_id, date);

-- Equipment-related indexes
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_category_id ON equipment(category_id);
CREATE INDEX IF NOT EXISTS idx_equipment_assigned_to ON equipment(assigned_to);
CREATE INDEX IF NOT EXISTS idx_equipment_location ON equipment(location);

-- Project-related indexes
CREATE INDEX IF NOT EXISTS idx_projects_customer_id ON projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON projects(manager_id);

-- User-related indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

-- Payment-related indexes
CREATE INDEX IF NOT EXISTS idx_employee_payments_employee_id ON employee_payments(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_payments_payment_date ON employee_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_employee_payments_status ON employee_payments(status);

-- Document-related indexes
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_document_type ON employee_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_employee_documents_status ON employee_documents(status);

-- Leave-related indexes
CREATE INDEX IF NOT EXISTS idx_employee_leaves_employee_id ON employee_leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_leaves_start_date ON employee_leaves(start_date);
CREATE INDEX IF NOT EXISTS idx_employee_leaves_status ON employee_leaves(status);

-- Maintenance-related indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_equipment_id ON maintenance(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_scheduled_date ON maintenance(scheduled_date);

-- Customer-related indexes
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- Company-related indexes
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at);

-- Notification-related indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Assignment-related indexes
CREATE INDEX IF NOT EXISTS idx_assignments_employee_id ON assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_assignments_project_id ON assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);

-- Salary increment indexes
CREATE INDEX IF NOT EXISTS idx_salary_increments_employee_id ON salary_increments(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_increments_status ON salary_increments(status);
CREATE INDEX IF NOT EXISTS idx_salary_increments_effective_date ON salary_increments(effective_date);

-- Final settlement indexes
CREATE INDEX IF NOT EXISTS idx_final_settlements_employee_id ON final_settlements(employee_id);
CREATE INDEX IF NOT EXISTS idx_final_settlements_status ON final_settlements(status);
CREATE INDEX IF NOT EXISTS idx_final_settlements_created_at ON final_settlements(created_at);

-- Payroll indexes
CREATE INDEX IF NOT EXISTS idx_payroll_employee_id ON payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_month ON payroll(month);
CREATE INDEX IF NOT EXISTS idx_payroll_year ON payroll(year);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll(status);

-- Quotation indexes
CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON quotations(created_at);

-- Project task indexes
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_project_tasks_priority ON project_tasks(priority);

-- Project milestone indexes
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_status ON project_milestones(status);
CREATE INDEX IF NOT EXISTS idx_project_milestones_due_date ON project_milestones(due_date);

-- Project material indexes
CREATE INDEX IF NOT EXISTS idx_project_materials_project_id ON project_materials(project_id);
CREATE INDEX IF NOT EXISTS idx_project_materials_category ON project_materials(category);
CREATE INDEX IF NOT EXISTS idx_project_materials_status ON project_materials(status);

-- Project manpower indexes
CREATE INDEX IF NOT EXISTS idx_project_manpower_project_id ON project_manpower(project_id);
CREATE INDEX IF NOT EXISTS idx_project_manpower_employee_id ON project_manpower(employee_id);
CREATE INDEX IF NOT EXISTS idx_project_manpower_status ON project_manpower(status);

-- Project equipment indexes
CREATE INDEX IF NOT EXISTS idx_project_equipment_project_id ON project_equipment(project_id);
CREATE INDEX IF NOT EXISTS idx_project_equipment_equipment_id ON project_equipment(equipment_id);
CREATE INDEX IF NOT EXISTS idx_project_equipment_status ON project_equipment(status);

-- Project fuel indexes
CREATE INDEX IF NOT EXISTS idx_project_fuel_project_id ON project_fuel(project_id);
CREATE INDEX IF NOT EXISTS idx_project_fuel_date ON project_fuel(date);

-- Project expense indexes
CREATE INDEX IF NOT EXISTS idx_project_expenses_project_id ON project_expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_category ON project_expenses(category);
CREATE INDEX IF NOT EXISTS idx_project_expenses_date ON project_expenses(date);

-- Project subcontractor indexes
CREATE INDEX IF NOT EXISTS idx_project_subcontractors_project_id ON project_subcontractors(project_id);
CREATE INDEX IF NOT EXISTS idx_project_subcontractors_status ON project_subcontractors(status);

-- Equipment assignment indexes
CREATE INDEX IF NOT EXISTS idx_equipment_assignments_equipment_id ON equipment_assignments(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_assignments_project_id ON equipment_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_equipment_assignments_status ON equipment_assignments(status);

-- Safety incident indexes
CREATE INDEX IF NOT EXISTS idx_safety_incidents_project_id ON safety_incidents(project_id);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_severity ON safety_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_status ON safety_incidents(status);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_date ON safety_incidents(incident_date);

-- Location indexes
CREATE INDEX IF NOT EXISTS idx_locations_status ON locations(status);
CREATE INDEX IF NOT EXISTS idx_locations_created_at ON locations(created_at);

-- Permission indexes
CREATE INDEX IF NOT EXISTS idx_permissions_guard_name ON permissions(guard_name);
CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);

-- Role permission indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- User role indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- Equipment category indexes
CREATE INDEX IF NOT EXISTS idx_equipment_categories_status ON equipment_categories(status);
CREATE INDEX IF NOT EXISTS idx_equipment_categories_name ON equipment_categories(name);

-- Department indexes
CREATE INDEX IF NOT EXISTS idx_departments_status ON departments(status);
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);

-- Designation indexes
CREATE INDEX IF NOT EXISTS idx_designations_status ON designations(status);
CREATE INDEX IF NOT EXISTS idx_designations_name ON designations(name);

-- Rental item indexes
CREATE INDEX IF NOT EXISTS idx_rental_items_rental_id ON rental_items(rental_id);
CREATE INDEX IF NOT EXISTS idx_rental_items_equipment_id ON rental_items(equipment_id);

-- Report indexes
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

-- Project template indexes
CREATE INDEX IF NOT EXISTS idx_project_templates_category ON project_templates(category);
CREATE INDEX IF NOT EXISTS idx_project_templates_status ON project_templates(status);

-- Company document type indexes
CREATE INDEX IF NOT EXISTS idx_company_document_types_status ON company_document_types(status);
CREATE INDEX IF NOT EXISTS idx_company_document_types_name ON company_document_types(name);

-- Company document type file indexes
CREATE INDEX IF NOT EXISTS idx_company_document_type_files_document_type_id ON company_document_type_files(document_type_id);
CREATE INDEX IF NOT EXISTS idx_company_document_type_files_status ON company_document_type_files(status);

-- Equipment document indexes
CREATE INDEX IF NOT EXISTS idx_equipment_documents_equipment_id ON equipment_documents(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_documents_document_type ON equipment_documents(document_type);

-- Equipment maintenance item indexes
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_items_maintenance_id ON equipment_maintenance_items(maintenance_id);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_items_item_type ON equipment_maintenance_items(item_type);

-- Equipment rental history indexes
CREATE INDEX IF NOT EXISTS idx_equipment_rental_history_equipment_id ON equipment_rental_history(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_rental_history_rental_id ON equipment_rental_history(rental_id);
CREATE INDEX IF NOT EXISTS idx_equipment_rental_history_start_date ON equipment_rental_history(start_date);

-- Payroll run indexes
CREATE INDEX IF NOT EXISTS idx_payroll_runs_month ON payroll_runs(month);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_year ON payroll_runs(year);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_status ON payroll_runs(status);

-- Time off request indexes
CREATE INDEX IF NOT EXISTS idx_time_off_requests_employee_id ON time_off_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_status ON time_off_requests(status);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_start_date ON time_off_requests(start_date);

-- Weekly timesheet indexes
CREATE INDEX IF NOT EXISTS idx_weekly_timesheets_employee_id ON weekly_timesheets(employee_id);
CREATE INDEX IF NOT EXISTS idx_weekly_timesheets_week_start ON weekly_timesheets(week_start);

-- Timesheet approval indexes
CREATE INDEX IF NOT EXISTS idx_timesheet_approvals_timesheet_id ON timesheet_approvals(timesheet_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_approvals_status ON timesheet_approvals(status);

-- Time entry indexes
CREATE INDEX IF NOT EXISTS idx_time_entries_timesheet_id ON time_entries(timesheet_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);

-- Employee skill indexes
CREATE INDEX IF NOT EXISTS idx_employee_skills_employee_id ON employee_skills(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_skills_skill_id ON employee_skills(skill_id);

-- Employee training indexes
CREATE INDEX IF NOT EXISTS idx_employee_training_employee_id ON employee_training(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_training_training_id ON employee_training(training_id);
CREATE INDEX IF NOT EXISTS idx_employee_training_status ON employee_training(status);

-- Employee performance review indexes
CREATE INDEX IF NOT EXISTS idx_employee_performance_reviews_employee_id ON employee_performance_reviews(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_performance_reviews_reviewer_id ON employee_performance_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_employee_performance_reviews_review_date ON employee_performance_reviews(review_date);

-- Employee resignation indexes
CREATE INDEX IF NOT EXISTS idx_employee_resignations_employee_id ON employee_resignations(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_resignations_resignation_date ON employee_resignations(resignation_date);

-- Skill indexes
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_status ON skills(status);

-- Training indexes
CREATE INDEX IF NOT EXISTS idx_trainings_category ON trainings(category);
CREATE INDEX IF NOT EXISTS idx_trainings_status ON trainings(status);
CREATE INDEX IF NOT EXISTS idx_trainings_start_date ON trainings(start_date);

-- Media indexes
CREATE INDEX IF NOT EXISTS idx_media_model_type ON media(model_type);
CREATE INDEX IF NOT EXISTS idx_media_model_id ON media(model_id);
CREATE INDEX IF NOT EXISTS idx_media_collection_name ON media(collection_name);

-- Geofence zone indexes
CREATE INDEX IF NOT EXISTS idx_geofence_zones_status ON geofence_zones(status);
CREATE INDEX IF NOT EXISTS idx_geofence_zones_type ON geofence_zones(type);

-- Analytics report indexes
CREATE INDEX IF NOT EXISTS idx_analytics_reports_type ON analytics_reports(type);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_generated_at ON analytics_reports(generated_at);

-- Tax document indexes
CREATE INDEX IF NOT EXISTS idx_tax_documents_type ON tax_documents(type);
CREATE INDEX IF NOT EXISTS idx_tax_documents_year ON tax_documents(year);
CREATE INDEX IF NOT EXISTS idx_tax_documents_status ON tax_documents(status);

-- Organizational unit indexes
CREATE INDEX IF NOT EXISTS idx_organizational_units_parent_id ON organizational_units(parent_id);
CREATE INDEX IF NOT EXISTS idx_organizational_units_type ON organizational_units(type);
CREATE INDEX IF NOT EXISTS idx_organizational_units_status ON organizational_units(status);

-- Cache indexes
CREATE INDEX IF NOT EXISTS idx_cache_key ON cache(key);
CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON cache(expires_at);

-- Job indexes
CREATE INDEX IF NOT EXISTS idx_jobs_queue ON jobs(queue);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);

-- Failed job indexes
CREATE INDEX IF NOT EXISTS idx_failed_jobs_queue ON failed_jobs(queue);
CREATE INDEX IF NOT EXISTS idx_failed_jobs_failed_at ON failed_jobs(failed_at);

-- Personal access token indexes
CREATE INDEX IF NOT EXISTS idx_personal_access_tokens_tokenable_type ON personal_access_tokens(tokenable_type);
CREATE INDEX IF NOT EXISTS idx_personal_access_tokens_tokenable_id ON personal_access_tokens(tokenable_id);
CREATE INDEX IF NOT EXISTS idx_personal_access_tokens_expires_at ON personal_access_tokens(expires_at);

-- Password reset token indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_created_at ON password_reset_tokens(created_at);

-- Session indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity);

-- Telescope entry indexes
CREATE INDEX IF NOT EXISTS idx_telescope_entries_batch_id ON telescope_entries(batch_id);
CREATE INDEX IF NOT EXISTS idx_telescope_entries_family_hash ON telescope_entries(family_hash);
CREATE INDEX IF NOT EXISTS idx_telescope_entries_created_at ON telescope_entries(created_at);

-- Telescope entry tag indexes
CREATE INDEX IF NOT EXISTS idx_telescope_entry_tags_entry_id ON telescope_entry_tags(entry_id);
CREATE INDEX IF NOT EXISTS idx_telescope_entry_tags_tag ON telescope_entry_tags(tag);

-- Telescope monitoring indexes
CREATE INDEX IF NOT EXISTS idx_telescope_monitoring_tag ON telescope_monitoring(tag);
CREATE INDEX IF NOT EXISTS idx_telescope_monitoring_created_at ON telescope_monitoring(created_at);

-- Prisma migration indexes
CREATE INDEX IF NOT EXISTS idx_prisma_migrations_applied_at ON _prisma_migrations(applied_at);

-- Comments on indexes for documentation
COMMENT ON INDEX idx_employees_department_id IS 'Improves queries filtering employees by department';
COMMENT ON INDEX idx_rentals_customer_id IS 'Improves queries filtering rentals by customer';
COMMENT ON INDEX idx_timesheets_employee_date IS 'Improves timesheet queries by employee and date range';
COMMENT ON INDEX idx_equipment_status IS 'Improves equipment status filtering queries';
COMMENT ON INDEX idx_projects_customer_id IS 'Improves project queries by customer';
COMMENT ON INDEX idx_users_email IS 'Improves user lookup by email for authentication';
COMMENT ON INDEX idx_employee_payments_employee_id IS 'Improves payment history queries by employee';
COMMENT ON INDEX idx_employee_documents_employee_id IS 'Improves document queries by employee';
COMMENT ON INDEX idx_employee_leaves_employee_id IS 'Improves leave queries by employee';
COMMENT ON INDEX idx_maintenance_equipment_id IS 'Improves maintenance queries by equipment';
COMMENT ON INDEX idx_customers_status IS 'Improves customer status filtering';
COMMENT ON INDEX idx_companies_status IS 'Improves company status filtering';
COMMENT ON INDEX idx_notifications_user_id IS 'Improves notification queries by user';
COMMENT ON INDEX idx_assignments_employee_id IS 'Improves assignment queries by employee';
COMMENT ON INDEX idx_salary_increments_employee_id IS 'Improves salary increment queries by employee';
COMMENT ON INDEX idx_final_settlements_employee_id IS 'Improves final settlement queries by employee';
COMMENT ON INDEX idx_payroll_employee_id IS 'Improves payroll queries by employee';
COMMENT ON INDEX idx_quotations_customer_id IS 'Improves quotation queries by customer';
COMMENT ON INDEX idx_project_tasks_project_id IS 'Improves project task queries by project';
COMMENT ON INDEX idx_project_milestones_project_id IS 'Improves project milestone queries by project';
COMMENT ON INDEX idx_project_materials_project_id IS 'Improves project material queries by project';
COMMENT ON INDEX idx_project_manpower_project_id IS 'Improves project manpower queries by project';
COMMENT ON INDEX idx_project_equipment_project_id IS 'Improves project equipment queries by project';
COMMENT ON INDEX idx_project_fuel_project_id IS 'Improves project fuel queries by project';
COMMENT ON INDEX idx_project_expenses_project_id IS 'Improves project expense queries by project';
COMMENT ON INDEX idx_project_subcontractors_project_id IS 'Improves project subcontractor queries by project';
COMMENT ON INDEX idx_equipment_assignments_equipment_id IS 'Improves equipment assignment queries by equipment';
COMMENT ON INDEX idx_safety_incidents_project_id IS 'Improves safety incident queries by project';
COMMENT ON INDEX idx_locations_status IS 'Improves location status filtering';
COMMENT ON INDEX idx_permissions_guard_name IS 'Improves permission queries by guard name';
COMMENT ON INDEX idx_role_permissions_role_id IS 'Improves role permission queries by role';
COMMENT ON INDEX idx_user_roles_user_id IS 'Improves user role queries by user';
COMMENT ON INDEX idx_equipment_categories_status IS 'Improves equipment category status filtering';
COMMENT ON INDEX idx_departments_status IS 'Improves department status filtering';
COMMENT ON INDEX idx_designations_status IS 'Improves designation status filtering';
COMMENT ON INDEX idx_rental_items_rental_id IS 'Improves rental item queries by rental';
COMMENT ON INDEX idx_reports_type IS 'Improves report queries by type';
COMMENT ON INDEX idx_project_templates_category IS 'Improves project template queries by category';
COMMENT ON INDEX idx_company_document_types_status IS 'Improves company document type status filtering';
COMMENT ON INDEX idx_company_document_type_files_document_type_id IS 'Improves company document type file queries by document type';
COMMENT ON INDEX idx_equipment_documents_equipment_id IS 'Improves equipment document queries by equipment';
COMMENT ON INDEX idx_equipment_maintenance_items_maintenance_id IS 'Improves equipment maintenance item queries by maintenance';
COMMENT ON INDEX idx_equipment_rental_history_equipment_id IS 'Improves equipment rental history queries by equipment';
COMMENT ON INDEX idx_payroll_runs_month IS 'Improves payroll run queries by month';
COMMENT ON INDEX idx_time_off_requests_employee_id IS 'Improves time off request queries by employee';
COMMENT ON INDEX idx_weekly_timesheets_employee_id IS 'Improves weekly timesheet queries by employee';
COMMENT ON INDEX idx_timesheet_approvals_timesheet_id IS 'Improves timesheet approval queries by timesheet';
COMMENT ON INDEX idx_time_entries_timesheet_id IS 'Improves time entry queries by timesheet';
COMMENT ON INDEX idx_employee_skills_employee_id IS 'Improves employee skill queries by employee';
COMMENT ON INDEX idx_employee_training_employee_id IS 'Improves employee training queries by employee';
COMMENT ON INDEX idx_employee_performance_reviews_employee_id IS 'Improves employee performance review queries by employee';
COMMENT ON INDEX idx_employee_resignations_employee_id IS 'Improves employee resignation queries by employee';
COMMENT ON INDEX idx_skills_category IS 'Improves skill queries by category';
COMMENT ON INDEX idx_trainings_category IS 'Improves training queries by category';
COMMENT ON INDEX idx_media_model_type IS 'Improves media queries by model type';
COMMENT ON INDEX idx_geofence_zones_status IS 'Improves geofence zone status filtering';
COMMENT ON INDEX idx_analytics_reports_type IS 'Improves analytics report queries by type';
COMMENT ON INDEX idx_tax_documents_type IS 'Improves tax document queries by type';
COMMENT ON INDEX idx_organizational_units_parent_id IS 'Improves organizational unit queries by parent';
COMMENT ON INDEX idx_cache_key IS 'Improves cache queries by key';
COMMENT ON INDEX idx_jobs_queue IS 'Improves job queries by queue';
COMMENT ON INDEX idx_failed_jobs_queue IS 'Improves failed job queries by queue';
COMMENT ON INDEX idx_personal_access_tokens_tokenable_type IS 'Improves personal access token queries by tokenable type';
COMMENT ON INDEX idx_password_reset_tokens_email IS 'Improves password reset token queries by email';
COMMENT ON INDEX idx_sessions_user_id IS 'Improves session queries by user';
COMMENT ON INDEX idx_telescope_entries_batch_id IS 'Improves telescope entry queries by batch';
COMMENT ON INDEX idx_telescope_entry_tags_entry_id IS 'Improves telescope entry tag queries by entry';
COMMENT ON INDEX idx_telescope_monitoring_tag IS 'Improves telescope monitoring queries by tag';
COMMENT ON INDEX idx_prisma_migrations_applied_at IS 'Improves prisma migration queries by applied date';
