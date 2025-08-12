ALTER TABLE "advance_payment_histories" ALTER COLUMN "payment_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "advance_payment_histories" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "advance_payment_histories" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "advance_payment_histories" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "advance_payment_histories" ALTER COLUMN "deleted_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "advance_payments" ALTER COLUMN "approved_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "advance_payments" ALTER COLUMN "rejected_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "advance_payments" ALTER COLUMN "repayment_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "advance_payments" ALTER COLUMN "payment_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "advance_payments" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "advance_payments" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "advance_payments" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "advance_payments" ALTER COLUMN "deleted_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "advance_payments" ALTER COLUMN "financeApprovalAt" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "advance_payments" ALTER COLUMN "hrApprovalAt" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "advance_payments" ALTER COLUMN "managerApprovalAt" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "analytics_reports" ALTER COLUMN "last_generated" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "analytics_reports" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "analytics_reports" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "analytics_reports" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "deleted_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "deleted_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "departments" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "departments" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "departments" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "departments" ALTER COLUMN "deleted_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "designations" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "designations" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "designations" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "designations" ALTER COLUMN "deleted_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_assignments" ALTER COLUMN "start_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_assignments" ALTER COLUMN "end_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_assignments" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_assignments" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "employee_assignments" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_documents" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_documents" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "employee_documents" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_leaves" ALTER COLUMN "start_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_leaves" ALTER COLUMN "end_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_leaves" ALTER COLUMN "approved_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_leaves" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_leaves" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "employee_leaves" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_leaves" ALTER COLUMN "rejected_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_performance_reviews" ALTER COLUMN "review_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_performance_reviews" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_performance_reviews" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "employee_performance_reviews" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_resignations" ALTER COLUMN "resignation_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_resignations" ALTER COLUMN "last_working_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_resignations" ALTER COLUMN "approved_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_resignations" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_resignations" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "employee_resignations" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_salaries" ALTER COLUMN "effective_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_salaries" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_salaries" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "employee_salaries" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_skill" ALTER COLUMN "certification_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_skill" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_skill" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "employee_skill" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_training" ALTER COLUMN "start_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_training" ALTER COLUMN "end_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_training" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employee_training" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "employee_training" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "date_of_birth" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "hire_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "iqama_expiry" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "passport_expiry" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "driving_license_expiry" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "operator_license_expiry" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "tuv_certification_expiry" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "spsp_license_expiry" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "access_restricted_until" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "access_start_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "access_end_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "deleted_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "equipment" ALTER COLUMN "purchase_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "equipment" ALTER COLUMN "warranty_expiry_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "equipment" ALTER COLUMN "last_maintenance_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "equipment" ALTER COLUMN "next_maintenance_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "equipment" ALTER COLUMN "last_metric_update" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "equipment" ALTER COLUMN "next_performance_review" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "equipment" ALTER COLUMN "last_utilization_update" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "equipment" ALTER COLUMN "last_depreciation_update" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "equipment" ALTER COLUMN "expected_replacement_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "equipment" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "equipment" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "equipment" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "equipment" ALTER COLUMN "deleted_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "equipment_maintenance" ALTER COLUMN "scheduled_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "equipment_maintenance" ALTER COLUMN "due_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "equipment_maintenance" ALTER COLUMN "started_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "equipment_maintenance" ALTER COLUMN "completed_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "equipment_maintenance" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "equipment_maintenance" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "equipment_maintenance" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "equipment_maintenance_items" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "equipment_maintenance_items" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "equipment_maintenance_items" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "equipment_rental_history" ALTER COLUMN "start_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "equipment_rental_history" ALTER COLUMN "end_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "equipment_rental_history" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "equipment_rental_history" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "equipment_rental_history" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "failed_jobs" ALTER COLUMN "failed_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "failed_jobs" ALTER COLUMN "failed_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "geofence_zones" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "geofence_zones" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "geofence_zones" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "approved_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "locations" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "locations" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "locations" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "media" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "media" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "media" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "organizational_units" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "organizational_units" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "organizational_units" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "organizational_units" ALTER COLUMN "deleted_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "payroll_items" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "payroll_items" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "payroll_items" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "payroll_runs" ALTER COLUMN "run_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "payroll_runs" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "payroll_runs" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "payroll_runs" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "payrolls" ALTER COLUMN "approved_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "payrolls" ALTER COLUMN "paid_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "payrolls" ALTER COLUMN "payment_processed_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "payrolls" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "payrolls" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "payrolls" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "payrolls" ALTER COLUMN "deleted_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "personal_access_tokens" ALTER COLUMN "last_used_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "personal_access_tokens" ALTER COLUMN "expires_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "personal_access_tokens" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "personal_access_tokens" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "personal_access_tokens" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "_prisma_migrations" ALTER COLUMN "finished_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "_prisma_migrations" ALTER COLUMN "rolled_back_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "_prisma_migrations" ALTER COLUMN "started_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "_prisma_migrations" ALTER COLUMN "started_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "project_resources" ALTER COLUMN "date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "project_resources" ALTER COLUMN "start_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "project_resources" ALTER COLUMN "end_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "project_resources" ALTER COLUMN "due_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "project_resources" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "project_resources" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "project_resources" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "start_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "end_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "deleted_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "rental_items" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "rental_items" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "rental_items" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "rental_operator_assignments" ALTER COLUMN "start_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "rental_operator_assignments" ALTER COLUMN "end_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "rental_operator_assignments" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "rental_operator_assignments" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "rental_operator_assignments" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "rentals" ALTER COLUMN "start_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "rentals" ALTER COLUMN "expected_end_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "rentals" ALTER COLUMN "actual_end_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "rentals" ALTER COLUMN "mobilization_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "rentals" ALTER COLUMN "invoice_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "rentals" ALTER COLUMN "payment_due_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "rentals" ALTER COLUMN "completed_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "rentals" ALTER COLUMN "approved_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "rentals" ALTER COLUMN "deposit_paid_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "rentals" ALTER COLUMN "deposit_refund_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "rentals" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "rentals" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "rentals" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "rentals" ALTER COLUMN "deleted_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "salary_increments" ALTER COLUMN "effective_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "salary_increments" ALTER COLUMN "approved_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "salary_increments" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "salary_increments" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "salary_increments" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "salary_increments" ALTER COLUMN "deleted_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "salary_increments" ALTER COLUMN "rejected_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "salary_increments" ALTER COLUMN "requested_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "salary_increments" ALTER COLUMN "requested_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "skills" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "skills" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "skills" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "tax_document_payrolls" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "tax_document_payrolls" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "tax_document_payrolls" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "tax_documents" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "tax_documents" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "tax_documents" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "telescope_entries" ALTER COLUMN "occurred_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "telescope_entries" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "telescope_entries" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "time_entries" ALTER COLUMN "start_time" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "time_entries" ALTER COLUMN "end_time" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "time_entries" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "time_entries" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "time_entries" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "time_off_requests" ALTER COLUMN "start_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "time_off_requests" ALTER COLUMN "end_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "time_off_requests" ALTER COLUMN "approved_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "time_off_requests" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "time_off_requests" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "time_off_requests" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "timesheet_approvals" ALTER COLUMN "approved_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "timesheet_approvals" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "timesheet_approvals" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "timesheet_approvals" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "timesheets" ALTER COLUMN "date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "timesheets" ALTER COLUMN "start_time" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "timesheets" ALTER COLUMN "end_time" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "timesheets" ALTER COLUMN "approved_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "timesheets" ALTER COLUMN "submitted_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "timesheets" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "timesheets" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "timesheets" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "timesheets" ALTER COLUMN "deleted_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "trainings" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "trainings" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "trainings" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email_verified_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "last_login_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "weekly_timesheets" ALTER COLUMN "week_start" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "weekly_timesheets" ALTER COLUMN "week_end" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "weekly_timesheets" ALTER COLUMN "approved_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "weekly_timesheets" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "weekly_timesheets" ALTER COLUMN "created_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "weekly_timesheets" ALTER COLUMN "updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "project_resources" DROP COLUMN "hours_worked";