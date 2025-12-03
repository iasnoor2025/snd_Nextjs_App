const { Client } = require('pg');
require('dotenv').config();

async function createRentalPaymentsTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Create rental_payments table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS "rental_payments" (
        "id" serial PRIMARY KEY NOT NULL,
        "rental_id" integer NOT NULL,
        "payment_id" text NOT NULL,
        "payment_date" date NOT NULL,
        "amount" numeric(12, 2) NOT NULL,
        "status" text DEFAULT 'pending' NOT NULL,
        "created_at" date DEFAULT CURRENT_DATE NOT NULL,
        "updated_at" date NOT NULL
      );
    `;

    await client.query(createTableSQL);
    console.log('✅ Created rental_payments table');

    // Add foreign key constraint
    const addForeignKeySQL = `
      ALTER TABLE "rental_payments" ADD CONSTRAINT "rental_payments_rental_id_rentals_id_fk" 
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
      CREATE UNIQUE INDEX IF NOT EXISTS "rental_payments_payment_id_key" ON "rental_payments" USING btree ("payment_id");
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

createRentalPaymentsTable();
