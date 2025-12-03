const { Pool } = require('pg');
require('dotenv').config();

async function checkEmployeeStatus() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Checking employee status in database...\n');
    
    // Check employees table
    const employeesResult = await pool.query(`
      SELECT 
        e.id,
        e.first_name,
        e.last_name,
        e.email,
        e.user_id,
        u.email as user_email,
        u.role_id
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      LIMIT 10
    `);
    
    console.log('Employees found:', employeesResult.rows.length);
    employeesResult.rows.forEach(emp => {
      console.log(`- ${emp.first_name} ${emp.last_name} (User ID: ${emp.user_id}, Role ID: ${emp.role_id})`);
    });

    // Check users table
    const usersResult = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.role_id,
        r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LIMIT 10
    `);
    
    console.log('\nUsers found:', usersResult.rows.length);
    usersResult.rows.forEach(user => {
      console.log(`- ${user.email} (ID: ${user.id}, Role: ${user.role_name || 'No role'})`);
    });

    // Check roles table
    const rolesResult = await pool.query('SELECT * FROM roles ORDER BY id');
    console.log('\nAvailable roles:');
    rolesResult.rows.forEach(role => {
      console.log(`- ${role.name} (ID: ${role.id})`);
    });

  } catch (error) {
    console.error('Error checking employee status:', error.message);
  } finally {
    await pool.end();
  }
}

checkEmployeeStatus();
