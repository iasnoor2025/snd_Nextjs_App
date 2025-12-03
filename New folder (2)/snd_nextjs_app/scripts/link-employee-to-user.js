const { Pool } = require('pg');
require('dotenv').config();

async function linkEmployeeToUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Linking employee to user account...\n');
    
    // First, let's see what users are available
    const usersResult = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.role_id,
        r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.role_id IS NOT NULL
      ORDER BY u.id
    `);
    
    console.log('Available users:');
    usersResult.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.role_name})`);
    });

    // Let's see what employees are available
    const employeesResult = await pool.query(`
      SELECT 
        e.id,
        e.first_name,
        e.last_name,
        e.email,
        e.user_id
      FROM employees e
      WHERE e.user_id IS NULL
      ORDER BY e.id
      LIMIT 5
    `);
    
    console.log('\nAvailable employees (not linked to users):');
    employeesResult.rows.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.first_name} ${emp.last_name} (${emp.email || 'No email'})`);
    });

    // For demonstration, let's link the first employee to the first user
    if (employeesResult.rows.length > 0 && usersResult.rows.length > 0) {
      const employee = employeesResult.rows[0];
      const user = usersResult.rows[0];
      
      console.log(`\nLinking employee "${employee.first_name} ${employee.last_name}" to user "${user.email}"...`);
      
      const updateResult = await pool.query(`
        UPDATE employees 
        SET user_id = $1, updated_at = CURRENT_DATE
        WHERE id = $2
      `, [user.id, employee.id]);
      
      if (updateResult.rowCount > 0) {
        console.log('✅ Successfully linked employee to user!');
        
        // Verify the update
        const verifyResult = await pool.query(`
          SELECT 
            e.id,
            e.first_name,
            e.last_name,
            e.user_id,
            u.email as user_email
          FROM employees e
          LEFT JOIN users u ON e.user_id = u.id
          WHERE e.id = $1
        `, [employee.id]);
        
        console.log('Verification:', verifyResult.rows[0]);
      } else {
        console.log('❌ Failed to link employee to user');
      }
    } else {
      console.log('No employees or users available for linking');
    }

  } catch (error) {
    console.error('Error linking employee to user:', error.message);
  } finally {
    await pool.end();
  }
}

linkEmployeeToUser();
