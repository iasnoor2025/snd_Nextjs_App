const { Client } = require('pg');
require('dotenv').config();

async function checkAllInvoices() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check all invoices
    const checkAllSQL = `
      SELECT COUNT(*) as count FROM rental_invoices;
    `;

    const result = await client.query(checkAllSQL);
    console.log('Total invoices in rental_invoices table:', result.rows[0].count);

    // Check all invoices with details
    const checkDetailsSQL = `
      SELECT * FROM rental_invoices ORDER BY created_at DESC LIMIT 5;
    `;

    const detailsResult = await client.query(checkDetailsSQL);
    console.log('Recent invoices:', detailsResult.rows);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkAllInvoices();
