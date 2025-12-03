const { Client } = require('pg');
require('dotenv').config();

async function checkRentalItemsOperators() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check rental items for rental ID 16
    const checkItemsSQL = `
      SELECT ri.*, e.first_name, e.last_name, e.id as employee_id
      FROM rental_items ri
      LEFT JOIN employees e ON ri.operator_id = e.id
      WHERE ri.rental_id = 16
      ORDER BY ri.id;
    `;

    const result = await client.query(checkItemsSQL);
    console.log('Rental items with operator data:');
    result.rows.forEach((item, index) => {
      console.log(`Item ${index + 1}:`, {
        id: item.id,
        equipment_name: item.equipment_name,
        operator_id: item.operator_id,
        employee_id: item.employee_id,
        operator_name: item.first_name && item.last_name ? `${item.first_name} ${item.last_name}` : 'NULL'
      });
    });

    // Check if there are any employees at all
    const checkEmployeesSQL = `
      SELECT id, first_name, last_name FROM employees LIMIT 5;
    `;

    const employeesResult = await client.query(checkEmployeesSQL);
    console.log('\nSample employees:');
    employeesResult.rows.forEach((emp, index) => {
      console.log(`Employee ${index + 1}:`, {
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`
      });
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkRentalItemsOperators();
