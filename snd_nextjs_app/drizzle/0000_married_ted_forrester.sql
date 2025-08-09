-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"email" text,
	"phone" text,
	"logo" text,
	"legal_document" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"deleted_at" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "analytics_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_by" text,
	"schedule" text,
	"parameters" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_generated" timestamp(3),
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advance_payment_histories" (
	"id" serial PRIMARY KEY NOT NULL,
	"advance_payment_id" integer NOT NULL,
	"employee_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_date" timestamp(3) NOT NULL,
	"notes" text,
	"recorded_by" integer,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"deleted_at" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "employee_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"project_id" integer,
	"rental_id" integer,
	"start_date" timestamp(3) NOT NULL,
	"end_date" timestamp(3),
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"location" text,
	"name" text,
	"type" text DEFAULT 'manual' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_rental_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"equipment_id" integer NOT NULL,
	"rental_id" integer,
	"project_id" integer,
	"employee_id" integer,
	"assignment_type" text DEFAULT 'rental' NOT NULL,
	"start_date" timestamp(3) NOT NULL,
	"end_date" timestamp(3),
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"daily_rate" numeric(10, 2),
	"total_amount" numeric(10, 2),
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"address" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"country" text,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"quantity" integer,
	"unit_cost" numeric(10, 2),
	"total_cost" numeric(10, 2),
	"date" timestamp(3),
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"employee_id" integer,
	"worker_name" text,
	"job_title" text,
	"daily_rate" numeric(10, 2),
	"days_worked" integer,
	"start_date" timestamp(3),
	"end_date" timestamp(3),
	"total_days" integer,
	"equipment_id" integer,
	"equipment_name" text,
	"operator_name" text,
	"hourly_rate" numeric(10, 2),
	"hours_worked" numeric(10, 2),
	"usage_hours" numeric(10, 2),
	"maintenance_cost" numeric(10, 2),
	"material_name" text,
	"unit" text,
	"unit_price" numeric(10, 2),
	"material_id" integer,
	"fuel_type" text,
	"liters" numeric(10, 2),
	"price_per_liter" numeric(10, 2),
	"category" text,
	"expense_description" text,
	"amount" numeric(10, 2),
	"title" text,
	"priority" text,
	"due_date" timestamp(3),
	"completion_percentage" integer,
	"assigned_to_id" integer,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_prisma_migrations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"finished_at" timestamp with time zone,
	"migration_name" varchar(255) NOT NULL,
	"logs" text,
	"rolled_back_at" timestamp with time zone,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applied_steps_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advance_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"purpose" text NOT NULL,
	"reason" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_by" integer,
	"approved_at" timestamp(3),
	"rejected_by" integer,
	"rejected_at" timestamp(3),
	"rejection_reason" text,
	"repayment_date" timestamp(3),
	"estimated_months" integer,
	"monthly_deduction" numeric(10, 2),
	"payment_date" timestamp(3),
	"repaid_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"deleted_at" timestamp(3),
	"financeApprovalAt" timestamp(3),
	"financeApprovalBy" integer,
	"financeApprovalNotes" text,
	"hrApprovalAt" timestamp(3),
	"hrApprovalBy" integer,
	"hrApprovalNotes" text,
	"managerApprovalAt" timestamp(3),
	"managerApprovalBy" integer,
	"managerApprovalNotes" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "salary_increments" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"increment_type" text NOT NULL,
	"effective_date" timestamp(3) NOT NULL,
	"reason" text NOT NULL,
	"approved_by" integer,
	"approved_at" timestamp(3),
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"current_base_salary" numeric(10, 2) NOT NULL,
	"current_food_allowance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"current_housing_allowance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"current_transport_allowance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"deleted_at" timestamp(3),
	"increment_amount" numeric(10, 2),
	"increment_percentage" numeric(5, 2),
	"new_base_salary" numeric(10, 2) NOT NULL,
	"new_food_allowance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"new_housing_allowance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"new_transport_allowance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"rejected_at" timestamp(3),
	"rejected_by" integer,
	"rejection_reason" text,
	"requested_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"requested_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_maintenance" (
	"id" serial PRIMARY KEY NOT NULL,
	"equipment_id" integer NOT NULL,
	"title" text DEFAULT 'Maintenance' NOT NULL,
	"description" text,
	"status" text DEFAULT 'open' NOT NULL,
	"type" text DEFAULT 'corrective' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"requested_by" integer,
	"assigned_to_employee_id" integer,
	"scheduled_date" timestamp(3),
	"due_date" timestamp(3),
	"started_at" timestamp(3),
	"completed_at" timestamp(3),
	"cost" numeric(12, 2),
	"meter_reading" numeric(12, 2),
	"notes" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_maintenance_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"maintenance_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unit" text,
	"unit_cost" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_cost" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geofence_zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"latitude" numeric(10, 8) NOT NULL,
	"longitude" numeric(11, 8) NOT NULL,
	"radius" numeric(8, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"disk" text DEFAULT 'public' NOT NULL,
	"collection" text,
	"model_type" text,
	"model_id" integer,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"email" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer,
	"ip_address" text,
	"user_agent" text,
	"payload" text NOT NULL,
	"last_activity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cache" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"expiration" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"queue" text NOT NULL,
	"payload" text NOT NULL,
	"attempts" integer NOT NULL,
	"reserved_at" integer,
	"available_at" integer NOT NULL,
	"created_at" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "failed_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" text NOT NULL,
	"connection" text NOT NULL,
	"queue" text NOT NULL,
	"payload" text NOT NULL,
	"exception" text NOT NULL,
	"failed_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_access_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"tokenable_type" text NOT NULL,
	"tokenable_id" integer NOT NULL,
	"name" text NOT NULL,
	"token" text NOT NULL,
	"abilities" text,
	"last_used_at" timestamp(3),
	"expires_at" timestamp(3),
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telescope_entries" (
	"sequence" integer PRIMARY KEY NOT NULL,
	"uuid" text NOT NULL,
	"batch_id" text,
	"family_hash" text,
	"should_index_on_display" boolean DEFAULT true NOT NULL,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"occurred_at" timestamp(3) NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telescope_monitoring" (
	"tag" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_leaves" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"leave_type" text NOT NULL,
	"start_date" timestamp(3) NOT NULL,
	"end_date" timestamp(3) NOT NULL,
	"days" integer NOT NULL,
	"reason" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_by" integer,
	"approved_at" timestamp(3),
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"rejected_at" timestamp(3),
	"rejected_by" integer,
	"rejection_reason" text
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"deleted_at" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "designations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"department_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"deleted_at" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"erpnext_id" text,
	"unit_id" integer,
	"file_number" text,
	"employee_id" text NOT NULL,
	"first_name" text NOT NULL,
	"middle_name" text,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"city" text,
	"state" text,
	"postal_code" text,
	"country" text,
	"nationality" text,
	"date_of_birth" timestamp(3),
	"hire_date" timestamp(3),
	"designation_id" integer,
	"department_id" integer,
	"user_id" integer,
	"supervisor" text,
	"hourly_rate" numeric(10, 2),
	"basic_salary" numeric(10, 2) DEFAULT '0' NOT NULL,
	"food_allowance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"housing_allowance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"transport_allowance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"absent_deduction_rate" numeric(10, 2) DEFAULT '0' NOT NULL,
	"overtime_rate_multiplier" numeric(10, 2) DEFAULT '1.5' NOT NULL,
	"overtime_fixed_rate" numeric(10, 2),
	"bank_name" text,
	"bank_account_number" text,
	"bank_iban" text,
	"contract_hours_per_day" integer DEFAULT 8 NOT NULL,
	"contract_days_per_month" integer DEFAULT 26 NOT NULL,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"emergency_contact_relationship" text,
	"notes" text,
	"advance_salary_eligible" boolean DEFAULT true NOT NULL,
	"advance_salary_approved_this_month" boolean DEFAULT false NOT NULL,
	"iqama_number" text,
	"iqama_expiry" timestamp(3),
	"iqama_cost" numeric(10, 2),
	"passport_number" text,
	"passport_expiry" timestamp(3),
	"driving_license_number" text,
	"driving_license_expiry" timestamp(3),
	"driving_license_cost" numeric(10, 2),
	"operator_license_number" text,
	"operator_license_expiry" timestamp(3),
	"operator_license_cost" numeric(10, 2),
	"tuv_certification_number" text,
	"tuv_certification_expiry" timestamp(3),
	"tuv_certification_cost" numeric(10, 2),
	"spsp_license_number" text,
	"spsp_license_expiry" timestamp(3),
	"spsp_license_cost" numeric(10, 2),
	"driving_license_file" text,
	"operator_license_file" text,
	"tuv_certification_file" text,
	"spsp_license_file" text,
	"passport_file" text,
	"iqama_file" text,
	"custom_certifications" jsonb,
	"is_operator" boolean DEFAULT false NOT NULL,
	"access_restricted_until" timestamp(3),
	"access_start_date" timestamp(3),
	"access_end_date" timestamp(3),
	"access_restriction_reason" text,
	"status" text DEFAULT 'active' NOT NULL,
	"current_location" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"deleted_at" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"national_id" text,
	"email_verified_at" timestamp(3),
	"provider" text,
	"provider_id" text,
	"remember_token" text,
	"role_id" integer DEFAULT 1 NOT NULL,
	"status" integer DEFAULT 1 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"locale" text,
	"avatar" text,
	"last_login_at" timestamp(3),
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizational_units" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"type" text NOT NULL,
	"parent_id" integer,
	"manager_id" integer,
	"level" integer DEFAULT 0 NOT NULL,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"deleted_at" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"customer_id" integer,
	"start_date" timestamp(3),
	"end_date" timestamp(3),
	"status" text DEFAULT 'active' NOT NULL,
	"budget" numeric(12, 2),
	"notes" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"deleted_at" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "rentals" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer,
	"rental_number" text NOT NULL,
	"project_id" integer,
	"start_date" timestamp(3) NOT NULL,
	"expected_end_date" timestamp(3),
	"actual_end_date" timestamp(3),
	"status" text DEFAULT 'pending' NOT NULL,
	"subtotal" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"discount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tax" numeric(12, 2) DEFAULT '0' NOT NULL,
	"final_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_by" integer,
	"equipment_name" text,
	"description" text,
	"quotation_id" integer,
	"mobilization_date" timestamp(3),
	"invoice_date" timestamp(3),
	"deposit_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"payment_terms_days" integer DEFAULT 30 NOT NULL,
	"payment_due_date" timestamp(3),
	"has_timesheet" boolean DEFAULT false NOT NULL,
	"has_operators" boolean DEFAULT false NOT NULL,
	"completed_by" integer,
	"completed_at" timestamp(3),
	"approved_by" integer,
	"approved_at" timestamp(3),
	"deposit_paid" boolean DEFAULT false NOT NULL,
	"deposit_paid_date" timestamp(3),
	"deposit_refunded" boolean DEFAULT false NOT NULL,
	"deposit_refund_date" timestamp(3),
	"invoice_id" text,
	"location_id" integer,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"deleted_at" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "employee_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"document_type" text NOT NULL,
	"file_path" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"description" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_salaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"basic_salary" numeric(10, 2) NOT NULL,
	"allowances" numeric(10, 2) DEFAULT '0' NOT NULL,
	"deductions" numeric(10, 2) DEFAULT '0' NOT NULL,
	"effective_date" timestamp(3) NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_performance_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"review_date" timestamp(3) NOT NULL,
	"reviewer_id" integer,
	"rating" integer,
	"comments" text,
	"goals" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_resignations" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"resignation_date" timestamp(3) NOT NULL,
	"last_working_date" timestamp(3),
	"reason" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_by" integer,
	"approved_at" timestamp(3),
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_skill" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"skill_id" integer NOT NULL,
	"proficiency_level" text,
	"certified" boolean DEFAULT false NOT NULL,
	"certification_date" timestamp(3),
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_training" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"training_id" integer NOT NULL,
	"start_date" timestamp(3),
	"end_date" timestamp(3),
	"status" text DEFAULT 'planned' NOT NULL,
	"certificate" text,
	"notes" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trainings" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"duration" integer,
	"cost" numeric(10, 2),
	"provider" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payrolls" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"base_salary" numeric(10, 2) NOT NULL,
	"overtime_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"bonus_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"deduction_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"advance_deduction" numeric(10, 2) DEFAULT '0' NOT NULL,
	"final_amount" numeric(10, 2) NOT NULL,
	"total_worked_hours" numeric(8, 2) DEFAULT '0' NOT NULL,
	"overtime_hours" numeric(8, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"approved_by" integer,
	"approved_at" timestamp(3),
	"paid_by" integer,
	"paid_at" timestamp(3),
	"payment_method" text,
	"payment_reference" text,
	"payment_status" text,
	"payment_processed_at" timestamp(3),
	"currency" text DEFAULT 'SAR' NOT NULL,
	"payroll_run_id" integer,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"deleted_at" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "payroll_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" text NOT NULL,
	"run_date" timestamp(3) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"run_by" integer NOT NULL,
	"total_employees" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"payroll_id" integer NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"is_taxable" boolean DEFAULT true NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"order" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"loan_type" text NOT NULL,
	"interest_rate" numeric(5, 2),
	"term_months" integer NOT NULL,
	"monthly_payment" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_by" integer,
	"approved_at" timestamp(3),
	"notes" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"document_type" text NOT NULL,
	"year" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"file_path" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_document_payrolls" (
	"id" serial PRIMARY KEY NOT NULL,
	"tax_document_id" integer NOT NULL,
	"payroll_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timesheets" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"assignment_id" integer,
	"project_id" integer,
	"rental_id" integer,
	"description" text,
	"date" timestamp(3) NOT NULL,
	"start_time" timestamp(3) NOT NULL,
	"end_time" timestamp(3),
	"hours_worked" numeric(5, 2) DEFAULT '0' NOT NULL,
	"overtime_hours" numeric(5, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_by" integer,
	"approved_by" integer,
	"approved_at" timestamp(3),
	"notes" text,
	"rejection_reason" text,
	"location" text,
	"project" text,
	"tasks" text,
	"submitted_at" timestamp(3),
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"deleted_at" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"timesheet_id" integer NOT NULL,
	"start_time" timestamp(3) NOT NULL,
	"end_time" timestamp(3),
	"hours" numeric(5, 2) NOT NULL,
	"description" text,
	"location" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"guard_name" text DEFAULT 'web' NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_timesheets" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"week_start" timestamp(3) NOT NULL,
	"week_end" timestamp(3) NOT NULL,
	"total_hours" numeric(8, 2) NOT NULL,
	"overtime_hours" numeric(8, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_by" integer,
	"approved_at" timestamp(3),
	"notes" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timesheet_approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"timesheet_id" integer NOT NULL,
	"approver_id" integer NOT NULL,
	"status" text NOT NULL,
	"comments" text,
	"approved_at" timestamp(3) NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_off_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"leave_type" text NOT NULL,
	"start_date" timestamp(3) NOT NULL,
	"end_date" timestamp(3) NOT NULL,
	"days" integer NOT NULL,
	"reason" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_by" integer,
	"approved_at" timestamp(3),
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"contact_person" text,
	"email" text,
	"phone" text,
	"address" text,
	"city" text,
	"state" text,
	"postal_code" text,
	"zip" text,
	"country" text,
	"website" text,
	"tax_id" text,
	"payment_terms" text,
	"tax_number" text,
	"credit_limit" numeric(12, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"user_id" integer,
	"erpnext_id" text,
	"company_name" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"deleted_at" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category_id" integer,
	"manufacturer" text,
	"model_number" text,
	"serial_number" text,
	"purchase_date" timestamp(3),
	"purchase_price" numeric(12, 2),
	"warranty_expiry_date" timestamp(3),
	"status" text DEFAULT 'available' NOT NULL,
	"location_id" integer,
	"assigned_to" integer,
	"last_maintenance_date" timestamp(3),
	"next_maintenance_date" timestamp(3),
	"notes" text,
	"unit" text,
	"default_unit_cost" numeric(12, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"daily_rate" numeric(12, 2),
	"weekly_rate" numeric(12, 2),
	"monthly_rate" numeric(12, 2),
	"erpnext_id" text,
	"door_number" text,
	"current_operating_hours" numeric(10, 2),
	"current_mileage" numeric(10, 2),
	"current_cycle_count" integer,
	"initial_operating_hours" numeric(10, 2),
	"initial_mileage" numeric(10, 2),
	"initial_cycle_count" integer,
	"last_metric_update" timestamp(3),
	"avg_daily_usage_hours" numeric(10, 2),
	"avg_daily_usage_miles" numeric(10, 2),
	"avg_operating_cost_per_hour" numeric(10, 2),
	"avg_operating_cost_per_mile" numeric(10, 2),
	"lifetime_maintenance_cost" numeric(15, 2),
	"efficiency_rating" numeric(5, 2),
	"next_performance_review" timestamp(3),
	"current_utilization_rate" numeric(5, 2),
	"avg_daily_utilization" numeric(5, 2),
	"avg_weekly_utilization" numeric(5, 2),
	"avg_monthly_utilization" numeric(5, 2),
	"idle_periods_count" integer,
	"total_idle_days" integer,
	"last_utilization_update" timestamp(3),
	"optimal_utilization_target" numeric(5, 2),
	"utilization_cost_impact" numeric(10, 2),
	"purchase_cost" numeric(12, 2),
	"depreciated_value" numeric(12, 2),
	"depreciation_rate" numeric(8, 4),
	"last_depreciation_update" timestamp(3),
	"expected_replacement_date" timestamp(3),
	"is_fully_depreciated" boolean DEFAULT false NOT NULL,
	"replacement_cost_estimate" numeric(12, 2),
	"value_appreciation" numeric(12, 2),
	"asset_condition" text,
	"supplier_id" integer,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"deleted_at" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "rental_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"rental_id" integer NOT NULL,
	"equipment_id" integer,
	"equipment_name" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"rate_type" text DEFAULT 'daily' NOT NULL,
	"days" integer,
	"operator_id" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rental_operator_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"rental_id" integer NOT NULL,
	"employee_id" integer NOT NULL,
	"start_date" timestamp(3) NOT NULL,
	"end_date" timestamp(3),
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"guard_name" text DEFAULT 'web' NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telescope_entry_tags" (
	"entry_uuid" text NOT NULL,
	"tag" text NOT NULL,
	CONSTRAINT "telescope_entry_tags_pkey" PRIMARY KEY("entry_uuid","tag")
);
--> statement-breakpoint
CREATE TABLE "model_has_roles" (
	"role_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	CONSTRAINT "model_has_roles_pkey" PRIMARY KEY("role_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "role_has_permissions" (
	"permission_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	CONSTRAINT "role_has_permissions_pkey" PRIMARY KEY("permission_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "model_has_permissions" (
	"permission_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	CONSTRAINT "model_has_permissions_pkey" PRIMARY KEY("permission_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "advance_payment_histories" ADD CONSTRAINT "advance_payment_histories_advance_payment_id_fkey" FOREIGN KEY ("advance_payment_id") REFERENCES "public"."advance_payments"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "advance_payment_histories" ADD CONSTRAINT "advance_payment_histories_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "equipment_rental_history" ADD CONSTRAINT "equipment_rental_history_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "equipment_rental_history" ADD CONSTRAINT "equipment_rental_history_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "equipment_rental_history" ADD CONSTRAINT "equipment_rental_history_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "equipment_rental_history" ADD CONSTRAINT "equipment_rental_history_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_resources" ADD CONSTRAINT "project_resources_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_resources" ADD CONSTRAINT "project_resources_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_resources" ADD CONSTRAINT "project_resources_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_resources" ADD CONSTRAINT "project_resources_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "advance_payments" ADD CONSTRAINT "advance_payments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "salary_increments" ADD CONSTRAINT "salary_increments_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "salary_increments" ADD CONSTRAINT "salary_increments_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "salary_increments" ADD CONSTRAINT "salary_increments_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "salary_increments" ADD CONSTRAINT "salary_increments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "equipment_maintenance" ADD CONSTRAINT "equipment_maintenance_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "equipment_maintenance" ADD CONSTRAINT "equipment_maintenance_assigned_to_employee_id_fkey" FOREIGN KEY ("assigned_to_employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "equipment_maintenance_items" ADD CONSTRAINT "equipment_maintenance_items_maintenance_id_fkey" FOREIGN KEY ("maintenance_id") REFERENCES "public"."equipment_maintenance"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "employee_leaves" ADD CONSTRAINT "employee_leaves_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "designations" ADD CONSTRAINT "designations_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_designation_id_fkey" FOREIGN KEY ("designation_id") REFERENCES "public"."designations"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."organizational_units"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "organizational_units" ADD CONSTRAINT "organizational_units_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."organizational_units"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "organizational_units" ADD CONSTRAINT "organizational_units_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "employee_salaries" ADD CONSTRAINT "employee_salaries_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "employee_performance_reviews" ADD CONSTRAINT "employee_performance_reviews_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "employee_resignations" ADD CONSTRAINT "employee_resignations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "employee_skill" ADD CONSTRAINT "employee_skill_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "employee_skill" ADD CONSTRAINT "employee_skill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "employee_training" ADD CONSTRAINT "employee_training_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "employee_training" ADD CONSTRAINT "employee_training_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "public"."trainings"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_paid_by_fkey" FOREIGN KEY ("paid_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "public"."payroll_runs"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_payroll_id_fkey" FOREIGN KEY ("payroll_id") REFERENCES "public"."payrolls"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tax_documents" ADD CONSTRAINT "tax_documents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tax_document_payrolls" ADD CONSTRAINT "tax_document_payrolls_tax_document_id_fkey" FOREIGN KEY ("tax_document_id") REFERENCES "public"."tax_documents"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tax_document_payrolls" ADD CONSTRAINT "tax_document_payrolls_payroll_id_fkey" FOREIGN KEY ("payroll_id") REFERENCES "public"."payrolls"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "public"."employee_assignments"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_timesheet_id_fkey" FOREIGN KEY ("timesheet_id") REFERENCES "public"."timesheets"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "weekly_timesheets" ADD CONSTRAINT "weekly_timesheets_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "timesheet_approvals" ADD CONSTRAINT "timesheet_approvals_timesheet_id_fkey" FOREIGN KEY ("timesheet_id") REFERENCES "public"."timesheets"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "rental_items" ADD CONSTRAINT "rental_items_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "rental_items" ADD CONSTRAINT "rental_items_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "rental_operator_assignments" ADD CONSTRAINT "rental_operator_assignments_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "rental_operator_assignments" ADD CONSTRAINT "rental_operator_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "model_has_roles" ADD CONSTRAINT "model_has_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "model_has_roles" ADD CONSTRAINT "model_has_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "role_has_permissions" ADD CONSTRAINT "role_has_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "role_has_permissions" ADD CONSTRAINT "role_has_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "model_has_permissions" ADD CONSTRAINT "model_has_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "model_has_permissions" ADD CONSTRAINT "model_has_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "failed_jobs_uuid_key" ON "failed_jobs" USING btree ("uuid" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "personal_access_tokens_token_key" ON "personal_access_tokens" USING btree ("token" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "telescope_entries_uuid_key" ON "telescope_entries" USING btree ("uuid" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "employees_employee_id_key" ON "employees" USING btree ("employee_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "employees_file_number_key" ON "employees" USING btree ("file_number" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "organizational_units_code_key" ON "organizational_units" USING btree ("code" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "rentals_rental_number_key" ON "rentals" USING btree ("rental_number" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "employee_skill_employee_id_skill_id_key" ON "employee_skill" USING btree ("employee_id" int4_ops,"skill_id" int4_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "payrolls_employee_id_month_year_key" ON "payrolls" USING btree ("employee_id" int4_ops,"month" int4_ops,"year" int4_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "payroll_runs_batch_id_key" ON "payroll_runs" USING btree ("batch_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "timesheets_employee_id_date_key" ON "timesheets" USING btree ("employee_id" int4_ops,"date" int4_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "roles_name_key" ON "roles" USING btree ("name" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "customers_erpnext_id_key" ON "customers" USING btree ("erpnext_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "equipment_door_number_key" ON "equipment" USING btree ("door_number" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "equipment_erpnext_id_key" ON "equipment" USING btree ("erpnext_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions" USING btree ("name" text_ops);
*/