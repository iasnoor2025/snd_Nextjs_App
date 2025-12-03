const { Client } = require('pg');
require('dotenv').config();

async function testRentalItemsAPI() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Test the same query that the API uses
    const testSQL = `
      SELECT 
        ri.id,
        ri.rental_id,
        ri.equipment_id,
        ri.equipment_name,
        ri.unit_price,
        ri.total_price,
        ri.rate_type,
        ri.operator_id,
        ri.status,
        ri.notes,
        ri.start_date,
        ri.created_at,
        ri.updated_at,
        e.model_number as equipment_model_number,
        e.category_id as equipment_category_id,
        emp.first_name as operator_first_name,
        emp.last_name as operator_last_name
      FROM rental_items ri
      LEFT JOIN equipment e ON ri.equipment_id = e.id
      LEFT JOIN employees emp ON ri.operator_id = emp.id
      WHERE ri.rental_id = 16
      ORDER BY ri.created_at DESC;
    `;

    const result = await client.query(testSQL);
    console.log('Rental items with operator data:');
    result.rows.forEach((item, index) => {
      console.log(`Item ${index + 1}:`, {
        id: item.id,
        equipment_name: item.equipment_name,
        operator_id: item.operator_id,
        operator_first_name: item.operator_first_name,
        operator_last_name: item.operator_last_name,
        operator_name: item.operator_first_name && item.operator_last_name 
          ? `${item.operator_first_name} ${item.operator_last_name}` 
          : 'N/A'
      });
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

testRentalItemsAPI();
