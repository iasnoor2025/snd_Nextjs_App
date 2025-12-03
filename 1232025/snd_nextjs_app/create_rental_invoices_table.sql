-- Create rental_invoices table
CREATE TABLE IF NOT EXISTS "rental_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"rental_id" integer NOT NULL,
	"invoice_id" text NOT NULL,
	"invoice_date" date NOT NULL,
	"due_date" date,
	"amount" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" date DEFAULT CURRENT_DATE NOT NULL,
	"updated_at" date NOT NULL
);

-- Add foreign key constraint
ALTER TABLE "rental_invoices" ADD CONSTRAINT "rental_invoices_rental_id_rentals_id_fk" 
FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE cascade ON UPDATE cascade;

-- Add unique index
CREATE UNIQUE INDEX IF NOT EXISTS "rental_invoices_invoice_id_key" ON "rental_invoices" USING btree ("invoice_id");
