const { Client } = require('pg');
require('dotenv').config();

async function checkInvoiceStatus() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check the latest invoice for rental ID 16
    const checkInvoiceSQL = `
      SELECT * FROM rental_invoices 
      WHERE rental_id = 16 
      ORDER BY created_at DESC 
      LIMIT 1;
    `;

    const result = await client.query(checkInvoiceSQL);
    console.log('Latest invoice for rental 16:', result.rows[0]);

    // Check rental status
    const checkRentalSQL = `
      SELECT id, rental_number, invoice_id, payment_status FROM rentals WHERE id = 16;
    `;

    const rentalResult = await client.query(checkRentalSQL);
    console.log('Rental 16 status:', rentalResult.rows[0]);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkInvoiceStatus();
