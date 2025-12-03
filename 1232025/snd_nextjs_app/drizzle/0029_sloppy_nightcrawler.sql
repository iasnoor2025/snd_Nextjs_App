CREATE TABLE "rental_invoices" (
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
--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "payment_id" text;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "last_payment_date" date;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "last_payment_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "outstanding_amount" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "last_invoice_date" date;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "last_invoice_id" text;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "last_invoice_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "rental_invoices" ADD CONSTRAINT "rental_invoices_rental_id_rentals_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "rental_invoices_invoice_id_key" ON "rental_invoices" USING btree ("invoice_id");