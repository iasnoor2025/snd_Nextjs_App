const { Client } = require('pg');
require('dotenv').config();

async function addStartDateToRentalItems() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Add start_date column to rental_items table
    const addColumnSQL = `
      ALTER TABLE rental_items 
      ADD COLUMN IF NOT EXISTS start_date date;
    `;

    await client.query(addColumnSQL);
    console.log('✅ Added start_date column to rental_items table');

    // Update existing rental items to have start_date = rental start_date
    const updateExistingSQL = `
      UPDATE rental_items 
      SET start_date = r.start_date 
      FROM rentals r 
      WHERE rental_items.rental_id = r.id 
      AND rental_items.start_date IS NULL;
    `;

    const result = await client.query(updateExistingSQL);
    console.log(`✅ Updated ${result.rowCount} existing rental items with rental start date`);

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
  }
}

addStartDateToRentalItems();
