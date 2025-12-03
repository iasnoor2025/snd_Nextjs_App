-- Add rental_item_id column to existing rental_timesheet_received table
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_timesheet_received') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_timesheet_received' AND column_name = 'rental_item_id') THEN
      -- Add the column first
      ALTER TABLE "rental_timesheet_received" ADD COLUMN "rental_item_id" integer;
      
      -- Drop old unique index if it exists
      DROP INDEX IF EXISTS "rental_timesheet_received_rental_month_key";
      
      -- Add foreign key for rental_item_id (only if rental_items table exists)
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_items') THEN
        BEGIN
          ALTER TABLE "rental_timesheet_received" ADD CONSTRAINT "rental_timesheet_received_rental_item_id_rental_items_id_fk" 
            FOREIGN KEY ("rental_item_id") REFERENCES "rental_items"("id") ON DELETE cascade ON UPDATE cascade;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END;
      END IF;
      
      -- Create new unique index
      CREATE UNIQUE INDEX IF NOT EXISTS "rental_timesheet_received_rental_item_month_key" 
        ON "rental_timesheet_received" ("rental_id","rental_item_id","month");
    END IF;
  END IF;
END $$;

