-- Create rental_equipment_timesheets table to track equipment usage hours for rental items
CREATE TABLE IF NOT EXISTS "rental_equipment_timesheets" (
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

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "rental_equipment_timesheets" ADD CONSTRAINT "rental_equipment_timesheets_rental_item_id_fkey" FOREIGN KEY ("rental_item_id") REFERENCES "rental_items"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "rental_equipment_timesheets" ADD CONSTRAINT "rental_equipment_timesheets_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "rentals"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "rental_equipment_timesheets" ADD CONSTRAINT "rental_equipment_timesheets_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create unique index for rental_item_id and date combination
CREATE UNIQUE INDEX IF NOT EXISTS "rental_equipment_timesheets_rental_item_date_key" ON "rental_equipment_timesheets" ("rental_item_id","date");

