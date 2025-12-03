const { Pool } = require('pg');
require('dotenv').config();
const bcrypt = require('bcryptjs');

async function createEmployeeUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Creating employee user account...\n');
    
    // First, let's see what roles are available
    const rolesResult = await pool.query(`
      SELECT id, name FROM roles WHERE name = 'EMPLOYEE'
    `);
    
    if (rolesResult.rows.length === 0) {
      console.log('❌ EMPLOYEE role not found in database');
      return;
    }
    
    const employeeRoleId = rolesResult.rows[0].id;
    console.log(`Found EMPLOYEE role with ID: ${employeeRoleId}`);
    
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

    if (employeesResult.rows.length === 0) {
      console.log('No employees available for linking');
      return;
    }

    // Select the first available employee
    const employee = employeesResult.rows[0];
    
    // Create a user account for this employee
    const userEmail = employee.email || `${employee.first_name.toLowerCase()}.${employee.last_name.toLowerCase()}@snd-ksa.com`;
    const userName = `${employee.first_name} ${employee.last_name}`;
    const userPassword = 'password123'; // Default password
    
    console.log(`\nCreating user account for employee "${userName}"...`);
    console.log(`Email: ${userEmail}`);
    console.log(`Password: ${userPassword}`);
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(userPassword, 10);
    
    // Insert the user (without is_active column)
    const insertUserResult = await pool.query(`
      INSERT INTO users (email, name, password, role_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_DATE, CURRENT_DATE)
      RETURNING id
    `, [userEmail, userName, hashedPassword, employeeRoleId]);
    
    if (insertUserResult.rows.length > 0) {
      const userId = insertUserResult.rows[0].id;
      console.log(`✅ Successfully created user with ID: ${userId}`);
      
      // Update the employee to link to this user
      const updateEmployeeResult = await pool.query(`
        UPDATE employees 
        SET user_id = $1, updated_at = CURRENT_DATE
        WHERE id = $2
      `, [userId, employee.id]);
      
      if (updateEmployeeResult.rowCount > 0) {
        console.log('✅ Successfully linked employee to user!');
        
        // Verify the setup
        const verifyResult = await pool.query(`
          SELECT 
            e.id,
            e.first_name,
            e.last_name,
            e.user_id,
            u.email as user_email,
            u.role_id,
            r.name as role_name
          FROM employees e
          LEFT JOIN users u ON e.user_id = u.id
          LEFT JOIN roles r ON u.role_id = r.id
          WHERE e.id = $1
        `, [employee.id]);
        
        console.log('\nVerification:');
        console.log(verifyResult.rows[0]);
        
        console.log(`\n🎉 Employee user account created successfully!`);
        console.log(`You can now login with:`);
        console.log(`Email: ${userEmail}`);
        console.log(`Password: ${userPassword}`);
        console.log(`Role: ${verifyResult.rows[0].role_name}`);
      } else {
        console.log('❌ Failed to link employee to user');
      }
    } else {
      console.log('❌ Failed to create user account');
    }

  } catch (error) {
    console.error('Error creating employee user:', error.message);
  } finally {
    await pool.end();
  }
}

createEmployeeUser();
