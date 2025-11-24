const { Client } = require('pg');
require('dotenv').config();

async function checkRentalInvoices() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if rental_invoices table exists and has data
    const checkTableSQL = `
      SELECT COUNT(*) as count FROM rental_invoices;
    `;

    const result = await client.query(checkTableSQL);
    console.log('Total invoices in rental_invoices table:', result.rows[0].count);

    // Check invoices for rental ID 16
    const checkRentalSQL = `
      SELECT * FROM rental_invoices WHERE rental_id = 16;
    `;

    const rentalResult = await client.query(checkRentalSQL);
    console.log('Invoices for rental ID 16:', rentalResult.rows);

    // Check if rental 16 exists
    const checkRentalSQL2 = `
      SELECT id, rental_number, invoice_id FROM rentals WHERE id = 16;
    `;

    const rentalExists = await client.query(checkRentalSQL2);
    console.log('Rental 16 details:', rentalExists.rows);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkRentalInvoices();
