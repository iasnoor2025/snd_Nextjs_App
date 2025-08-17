const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:fAfab9Ckow7o3yp2EhryEYKzHbyeMifPBHxi8Xb4f9sdnBgMI47Ytdaq2NWDCxy5@192.168.8.4:5432/snd_nextjs_db'
});

async function assignAdminRole() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Assigning Admin role to current user...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // 1. Get the Admin role ID
    const adminRoleResult = await client.query(
      'SELECT id FROM roles WHERE name = $1',
      ['SUPER_ADMIN']
    );
    
    if (adminRoleResult.rows.length === 0) {
      throw new Error('SUPER_ADMIN role not found');
    }
    
    const adminRoleId = adminRoleResult.rows[0].id;
    console.log(`✅ Found SUPER_ADMIN role with ID: ${adminRoleId}`);
    
    // 2. Get the first user (assuming this is the current user)
    const userResult = await client.query(
      'SELECT id, name, email FROM users ORDER BY id LIMIT 1'
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('No users found');
    }
    
    const user = userResult.rows[0];
    console.log(`✅ Found user: ${user.name} (${user.email}) with ID: ${user.id}`);
    
    // 3. Check if user already has a role assigned
    const existingRoleResult = await client.query(
      'SELECT role_id FROM model_has_roles WHERE user_id = $1',
      [user.id]
    );
    
    if (existingRoleResult.rows.length > 0) {
      console.log(`ℹ️ User already has role ID: ${existingRoleResult.rows[0].role_id}`);
      
      // Update to Admin role
      await client.query(
        'UPDATE model_has_roles SET role_id = $1 WHERE user_id = $2',
        [adminRoleId, user.id]
      );
      console.log(`✅ Updated user role to SUPER_ADMIN`);
    } else {
      // Assign Admin role
      await client.query(
        'INSERT INTO model_has_roles (role_id, user_id) VALUES ($1, $2)',
        [adminRoleId, user.id]
      );
      console.log(`✅ Assigned SUPER_ADMIN role to user`);
    }
    
    // 4. Update user's role field in the users table
    await client.query(
      'UPDATE users SET role = $1 WHERE id = $2',
      ['SUPER_ADMIN', user.id]
    );
    console.log(`✅ Updated user's role field to SUPER_ADMIN`);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('🎉 Admin role assignment completed successfully!');
    
    // 5. Verify the assignment
    const verificationResult = await client.query(`
      SELECT u.name, u.email, u.role, r.name as role_name
      FROM users u
      LEFT JOIN model_has_roles mhr ON u.id = mhr.user_id
      LEFT JOIN roles r ON mhr.role_id = r.id
      WHERE u.id = $1
    `, [user.id]);
    
    if (verificationResult.rows.length > 0) {
      const userInfo = verificationResult.rows[0];
      console.log('\n📋 User Role Verification:');
      console.log(`Name: ${userInfo.name}`);
      console.log(`Email: ${userInfo.email}`);
      console.log(`Role Field: ${userInfo.role}`);
      console.log(`Database Role: ${userInfo.role_name}`);
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error assigning admin role:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
assignAdminRole()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
