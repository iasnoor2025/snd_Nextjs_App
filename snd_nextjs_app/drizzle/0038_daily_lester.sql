CREATE TABLE "materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	"unit" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" date DEFAULT CURRENT_DATE NOT NULL,
	"updated_at" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rental_equipment_timesheets" (
	"id" serial PRIMARY KEY NOT NULL,
	"rental_item_id" integer NOT NULL,
	"rental_id" integer NOT NULL,
	"equipment_id" integer,
	"date" date NOT NULL,
	"regular_hours" numeric(5, 2) DEFAULT '0' NOT NULL,
	"overtime_hours" numeric(5, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_by" integer,
	"created_at" date DEFAULT CURRENT_DATE NOT NULL,
	"updated_at" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rental_timesheet_received" (
	"id" serial PRIMARY KEY NOT NULL,
	"rental_id" integer NOT NULL,
	"rental_item_id" integer,
	"month" text NOT NULL,
	"received" boolean DEFAULT false NOT NULL,
	"received_by" integer,
	"received_at" timestamp(3),
	"created_at" date DEFAULT CURRENT_DATE NOT NULL,
	"updated_at" date NOT NULL
);
--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD COLUMN "expires_at" date;--> statement-breakpoint
ALTER TABLE "rental_equipment_timesheets" ADD CONSTRAINT "rental_equipment_timesheets_rental_item_id_fkey" FOREIGN KEY ("rental_item_id") REFERENCES "public"."rental_items"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "rental_equipment_timesheets" ADD CONSTRAINT "rental_equipment_timesheets_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "rental_equipment_timesheets" ADD CONSTRAINT "rental_equipment_timesheets_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "rental_timesheet_received" ADD CONSTRAINT "rental_timesheet_received_rental_id_rentals_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "rental_timesheet_received" ADD CONSTRAINT "rental_timesheet_received_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "materials_name_key" ON "materials" USING btree ("name" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "rental_equipment_timesheets_rental_item_date_key" ON "rental_equipment_timesheets" USING btree ("rental_item_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "rental_timesheet_received_rental_item_month_key" ON "rental_timesheet_received" USING btree ("rental_id","rental_item_id","month");