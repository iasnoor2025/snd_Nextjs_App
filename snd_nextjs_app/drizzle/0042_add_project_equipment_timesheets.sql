-- Daily timesheet hours per project_equipment row (mirrors rental_equipment_timesheets pattern)
CREATE TABLE IF NOT EXISTS "project_equipment_timesheets" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_equipment_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"equipment_id" integer,
	"date" date NOT NULL,
	"regular_hours" numeric(5, 2) DEFAULT '0' NOT NULL,
	"overtime_hours" numeric(5, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_by" integer,
	"created_at" date DEFAULT CURRENT_DATE NOT NULL,
	"updated_at" date NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "project_equipment_timesheets" ADD CONSTRAINT "project_equipment_timesheets_project_equipment_id_fkey" FOREIGN KEY ("project_equipment_id") REFERENCES "project_equipment"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "project_equipment_timesheets" ADD CONSTRAINT "project_equipment_timesheets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "project_equipment_timesheets" ADD CONSTRAINT "project_equipment_timesheets_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "project_equipment_timesheets_pe_date_key" ON "project_equipment_timesheets" ("project_equipment_id","date");

-- Per-month received tracking for project equipment timesheets
CREATE TABLE IF NOT EXISTS "project_equipment_timesheet_received" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"project_equipment_id" integer NOT NULL,
	"month" text NOT NULL,
	"received" boolean DEFAULT false NOT NULL,
	"received_by" integer,
	"received_at" timestamp(3),
	"created_at" date DEFAULT CURRENT_DATE NOT NULL,
	"updated_at" date NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "project_equipment_timesheet_received" ADD CONSTRAINT "project_equipment_timesheet_received_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "project_equipment_timesheet_received" ADD CONSTRAINT "project_equipment_timesheet_received_project_equipment_id_fkey" FOREIGN KEY ("project_equipment_id") REFERENCES "project_equipment"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "project_equipment_timesheet_received" ADD CONSTRAINT "project_equipment_timesheet_received_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "project_equipment_timesheet_received_pe_month_key" ON "project_equipment_timesheet_received" ("project_equipment_id","month");
