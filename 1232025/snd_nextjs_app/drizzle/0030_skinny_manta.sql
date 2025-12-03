CREATE TABLE "rental_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"rental_id" integer NOT NULL,
	"payment_id" text NOT NULL,
	"payment_date" date NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" date DEFAULT CURRENT_DATE NOT NULL,
	"updated_at" date NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rental_items" ADD COLUMN "start_date" date;--> statement-breakpoint
ALTER TABLE "rental_items" ADD COLUMN "completed_date" date;--> statement-breakpoint
ALTER TABLE "rental_payments" ADD CONSTRAINT "rental_payments_rental_id_rentals_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "rental_payments_payment_id_key" ON "rental_payments" USING btree ("payment_id");