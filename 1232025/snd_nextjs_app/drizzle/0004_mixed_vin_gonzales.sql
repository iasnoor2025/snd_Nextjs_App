CREATE TABLE "project_equipment" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"equipment_id" integer NOT NULL,
	"operator_id" integer,
	"start_date" date NOT NULL,
	"end_date" date,
	"hourly_rate" numeric(10, 2) NOT NULL,
	"estimated_hours" numeric(8, 2),
	"actual_hours" numeric(8, 2),
	"maintenance_cost" numeric(10, 2),
	"fuel_consumption" numeric(8, 2),
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"assigned_by" integer,
	"created_at" date DEFAULT CURRENT_DATE NOT NULL,
	"updated_at" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"expense_date" date NOT NULL,
	"receipt_number" text,
	"approved_by" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_method" text,
	"vendor" text,
	"notes" text,
	"assigned_to" integer,
	"created_at" date DEFAULT CURRENT_DATE NOT NULL,
	"updated_at" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_fuel" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"fuel_type" text NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_price" numeric(8, 2) NOT NULL,
	"total_cost" numeric(10, 2),
	"supplier" text,
	"purchase_date" date NOT NULL,
	"equipment_id" integer,
	"operator_id" integer,
	"usage_notes" text,
	"status" text DEFAULT 'purchased' NOT NULL,
	"created_at" date DEFAULT CURRENT_DATE NOT NULL,
	"updated_at" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_manpower" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"employee_id" integer NOT NULL,
	"job_title" text NOT NULL,
	"daily_rate" numeric(10, 2) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"total_days" integer,
	"actual_days" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"assigned_by" integer,
	"created_at" date DEFAULT CURRENT_DATE NOT NULL,
	"updated_at" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"unit" text NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_cost" numeric(12, 2),
	"supplier" text,
	"order_date" date,
	"delivery_date" date,
	"status" text DEFAULT 'ordered' NOT NULL,
	"notes" text,
	"assigned_to" integer,
	"created_at" date DEFAULT CURRENT_DATE NOT NULL,
	"updated_at" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_subcontractors" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"company_name" text NOT NULL,
	"contact_person" text,
	"phone" text,
	"email" text,
	"scope_of_work" text NOT NULL,
	"contract_value" numeric(12, 2),
	"start_date" date NOT NULL,
	"end_date" date,
	"status" text DEFAULT 'active' NOT NULL,
	"payment_terms" text,
	"notes" text,
	"assigned_by" integer,
	"created_at" date DEFAULT CURRENT_DATE NOT NULL,
	"updated_at" date NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_equipment" ADD CONSTRAINT "project_equipment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_equipment" ADD CONSTRAINT "project_equipment_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_equipment" ADD CONSTRAINT "project_equipment_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_equipment" ADD CONSTRAINT "project_equipment_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_expenses" ADD CONSTRAINT "project_expenses_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_expenses" ADD CONSTRAINT "project_expenses_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_expenses" ADD CONSTRAINT "project_expenses_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_fuel" ADD CONSTRAINT "project_fuel_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_fuel" ADD CONSTRAINT "project_fuel_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_fuel" ADD CONSTRAINT "project_fuel_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_manpower" ADD CONSTRAINT "project_manpower_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_manpower" ADD CONSTRAINT "project_manpower_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_manpower" ADD CONSTRAINT "project_manpower_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_materials" ADD CONSTRAINT "project_materials_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_materials" ADD CONSTRAINT "project_materials_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_subcontractors" ADD CONSTRAINT "project_subcontractors_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_subcontractors" ADD CONSTRAINT "project_subcontractors_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE cascade;