const { Pool } = require('pg');
require('dotenv').config();

async function checkUserPermissions() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Checking User Permissions...\n');

    // Get a sample user (first user in the system)
    const userResult = await pool.query('SELECT id, name, email FROM users LIMIT 1');
    
    if (userResult.rows.length === 0) {
      console.log('❌ No users found in the database');
      return;
    }

    const user = userResult.rows[0];
    console.log(`👤 Checking permissions for user: ${user.name} (${user.email})`);
    console.log(`User ID: ${user.id}\n`);

    // Get user's roles
    const rolesResult = await pool.query(`
      SELECT r.name as role_name 
      FROM roles r 
      JOIN model_has_roles mhr ON r.id = mhr.role_id 
      WHERE mhr.user_id = $1
    `, [user.id]);

    console.log('📋 User Roles:');
    rolesResult.rows.forEach(role => {
      console.log(`  - ${role.role_name}`);
    });
    console.log('');

    // Get all Iqama permissions
    const iqamaPermissionsResult = await pool.query(`
      SELECT name 
      FROM permissions 
      WHERE name LIKE '%iqama%' OR name LIKE '%Iqama%'
      ORDER BY name
    `);

    console.log('🔐 All Iqama Permissions in Database:');
    iqamaPermissionsResult.rows.forEach(perm => {
      console.log(`  - ${perm.name}`);
    });
    console.log('');

    // Get user's Iqama permissions
    const userIqamaPermissionsResult = await pool.query(`
      SELECT DISTINCT p.name as permission_name
      FROM permissions p
      JOIN role_has_permissions rhp ON p.id = rhp.permission_id
      JOIN roles r ON rhp.role_id = r.id
      JOIN model_has_roles mhr ON r.id = mhr.role_id
      WHERE mhr.user_id = $1 
      AND (p.name LIKE '%iqama%' OR p.name LIKE '%Iqama%')
      ORDER BY p.name
    `, [user.id]);

    console.log('✅ User\'s Iqama Permissions:');
    if (userIqamaPermissionsResult.rows.length === 0) {
      console.log('  ❌ No Iqama permissions found for this user');
    } else {
      userIqamaPermissionsResult.rows.forEach(perm => {
        console.log(`  - ${perm.permission_name}`);
      });
    }
    console.log('');

    // Check specific permissions needed for dashboard sections
    const requiredPermissions = [
      'read.Employee', // for iqama section
      'manage.Iqama',  // for iqamaManagement section
    ];

    console.log('🎯 Checking Required Dashboard Permissions:');
    for (const requiredPerm of requiredPermissions) {
      const hasPermissionResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM permissions p
        JOIN role_has_permissions rhp ON p.id = rhp.permission_id
        JOIN roles r ON rhp.role_id = r.id
        JOIN model_has_roles mhr ON r.id = mhr.role_id
        WHERE mhr.user_id = $1 AND p.name = $2
      `, [user.id, requiredPerm]);

      const hasPermission = hasPermissionResult.rows[0].count > 0;
      console.log(`  ${requiredPerm}: ${hasPermission ? '✅ YES' : '❌ NO'}`);
    }

    console.log('\n📊 Summary:');
    console.log(`- Total Iqama permissions in DB: ${iqamaPermissionsResult.rows.length}`);
    console.log(`- User's Iqama permissions: ${userIqamaPermissionsResult.rows.length}`);
    console.log(`- Can access 'iqama' section: ${userIqamaPermissionsResult.rows.some(p => p.permission_name === 'read.Employee') ? 'YES' : 'NO'}`);
    console.log(`- Can access 'iqamaManagement' section: ${userIqamaPermissionsResult.rows.some(p => p.permission_name === 'manage.Iqama') ? 'YES' : 'NO'}`);

  } catch (error) {
    console.error('❌ Error checking user permissions:', error);
  } finally {
    await pool.end();
  }
}

checkUserPermissions();
