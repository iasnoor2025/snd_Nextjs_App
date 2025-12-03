const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);
const db = drizzle(sql);

async function checkSalaryIncrementStatus(id) {
  try {
    const result = await sql`
      SELECT id, status, employee_id, increment_type, reason 
      FROM salary_increments 
      WHERE id = ${id}
    `;
    
    if (result.length === 0) {
      console.log(`Salary increment with ID ${id} not found`);
    } else {
      const increment = result[0];
      console.log('Salary Increment Details:');
      console.log(`ID: ${increment.id}`);
      console.log(`Status: ${increment.status}`);
      console.log(`Employee ID: ${increment.employee_id}`);
      console.log(`Increment Type: ${increment.increment_type}`);
      console.log(`Reason: ${increment.reason}`);
    }
  } catch (error) {
    console.error('Error checking salary increment status:', error);
  }
}

async function listAllSalaryIncrements() {
  try {
    const result = await sql`
      SELECT id, status, employee_id, increment_type, reason 
      FROM salary_increments 
      ORDER BY id
    `;
    
    console.log('All Salary Increments:');
    console.log('ID | Status    | Employee ID | Type      | Reason');
    console.log('---|-----------|-------------|-----------|--------');
    
    result.forEach(increment => {
      console.log(`${increment.id.toString().padStart(2)} | ${increment.status.padEnd(9)} | ${increment.employee_id.toString().padStart(11)} | ${(increment.increment_type || 'N/A').padEnd(9)} | ${increment.reason || 'N/A'}`);
    });
    
    // Count by status
    const statusCounts = {};
    result.forEach(increment => {
      statusCounts[increment.status] = (statusCounts[increment.status] || 0) + 1;
    });
    
    console.log('\nStatus Summary:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`${status}: ${count}`);
    });
    
  } catch (error) {
    console.error('Error listing salary increments:', error);
  } finally {
    await sql.end();
  }
}

const id = process.argv[2];
if (!id) {
  console.log('Listing all salary increments...');
  listAllSalaryIncrements();
} else {
  checkSalaryIncrementStatus(parseInt(id));
}
