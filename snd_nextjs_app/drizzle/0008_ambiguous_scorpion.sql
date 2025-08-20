ALTER TABLE "project_equipment" DROP CONSTRAINT "project_equipment_operator_id_fkey";
--> statement-breakpoint
ALTER TABLE "project_manpower" DROP CONSTRAINT "project_manpower_employee_id_fkey";
--> statement-breakpoint
ALTER TABLE "project_manpower" ALTER COLUMN "employee_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "project_manpower" ALTER COLUMN "daily_rate" SET DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "project_manpower" ADD COLUMN "worker_name" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "project_manager_id" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "project_engineer_id" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "project_foreman_id" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "supervisor_id" integer;--> statement-breakpoint
ALTER TABLE "project_equipment" ADD CONSTRAINT "project_equipment_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "public"."project_manpower"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_manpower" ADD CONSTRAINT "project_manpower_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_manpower" ADD CONSTRAINT "project_manpower_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_manpower" ADD CONSTRAINT "project_manpower_assigned_by_employees_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_manpower" ADD CONSTRAINT "project_manpower_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_project_manager_id_fkey" FOREIGN KEY ("project_manager_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_project_engineer_id_fkey" FOREIGN KEY ("project_engineer_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_project_foreman_id_fkey" FOREIGN KEY ("project_foreman_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE cascade;