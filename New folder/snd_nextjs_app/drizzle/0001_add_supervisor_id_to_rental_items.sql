-- Add supervisor_id to rental_items for per-item supervisor/foreman assignment
ALTER TABLE "rental_items" ADD COLUMN IF NOT EXISTS "supervisor_id" integer;

-- Optional: no foreign key to employees table to keep flexibility; can be added later

