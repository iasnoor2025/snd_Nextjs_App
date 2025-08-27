const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);
const db = drizzle(sql);

async function createTestSalaryIncrement() {
  try {
    // First, let's get an employee ID
    const employees = await sql`
      SELECT id, first_name, last_name 
      FROM employees 
      LIMIT 1
    `;
    
    if (employees.length === 0) {
      console.log('No employees found in database');
      return;
    }
    
    const employee = employees[0];
    console.log(`Using employee: ${employee.first_name} ${employee.last_name} (ID: ${employee.id})`);
    
    // Create a test salary increment
    const result = await sql`
      INSERT INTO salary_increments (
        employee_id, 
        increment_type, 
        increment_percentage, 
        increment_amount, 
        reason, 
        effective_date, 
        status, 
        current_base_salary, 
        current_food_allowance, 
        current_housing_allowance, 
        current_transport_allowance,
        new_base_salary,
        new_food_allowance,
        new_housing_allowance,
        new_transport_allowance,
        requested_by,
        requested_at,
        updated_at
      ) VALUES (
        ${employee.id},
        'percentage',
        10.0,
        500.0,
        'Test increment for delete testing',
        ${new Date().toISOString().split('T')[0]},
        'pending',
        5000.0,
        500.0,
        800.0,
        300.0,
        5500.0,
        500.0,
        800.0,
        300.0,
        ${employee.id},
        ${new Date().toISOString().split('T')[0]},
        ${new Date().toISOString().split('T')[0]}
      ) RETURNING id, status, reason
    `;
    
    if (result.length > 0) {
      const newIncrement = result[0];
      console.log('\n✅ Test salary increment created successfully!');
      console.log(`ID: ${newIncrement.id}`);
      console.log(`Status: ${newIncrement.status}`);
      console.log(`Reason: ${newIncrement.reason}`);
      console.log('\nNow you can test the delete functionality with this pending increment!');
    }
    
  } catch (error) {
    console.error('Error creating test salary increment:', error);
  } finally {
    await sql.end();
  }
}

createTestSalaryIncrement();
