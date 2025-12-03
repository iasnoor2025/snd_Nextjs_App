const { Client } = require('pg');
require('dotenv').config();

async function createRentalInvoicesTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Create rental_invoices table
    const createTableSQL = `
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
    `;

    await client.query(createTableSQL);
    console.log('✅ Created rental_invoices table');

    // Add foreign key constraint
    const addForeignKeySQL = `
      ALTER TABLE "rental_invoices" ADD CONSTRAINT "rental_invoices_rental_id_rentals_id_fk" 
      FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE cascade ON UPDATE cascade;
    `;

    try {
      await client.query(addForeignKeySQL);
      console.log('✅ Added foreign key constraint');
    } catch (error) {
      console.log('⚠️ Foreign key constraint already exists or failed:', error.message);
    }

    // Add unique index
    const addIndexSQL = `
      CREATE UNIQUE INDEX IF NOT EXISTS "rental_invoices_invoice_id_key" ON "rental_invoices" USING btree ("invoice_id");
    `;

    try {
      await client.query(addIndexSQL);
      console.log('✅ Added unique index');
    } catch (error) {
      console.log('⚠️ Unique index already exists or failed:', error.message);
    }

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
  }
}

createRentalInvoicesTable();
