const { Pool } = require('pg');
require('dotenv').config();

async function findSuperAdmin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Finding Super Admin User...\n');

    // Find users with SUPER_ADMIN role
    const superAdminResult = await pool.query(`
      SELECT u.id, u.name, u.email, r.name as role_name
      FROM users u
      JOIN model_has_roles mhr ON u.id = mhr.user_id
      JOIN roles r ON mhr.role_id = r.id
      WHERE r.name = 'SUPER_ADMIN'
      ORDER BY u.id
    `);

    if (superAdminResult.rows.length === 0) {
      console.log('❌ No SUPER_ADMIN users found');
      
      // Check all available roles
      const rolesResult = await pool.query('SELECT name FROM roles ORDER BY name');
      console.log('\n📋 Available Roles:');
      rolesResult.rows.forEach(role => console.log(`  - ${role.name}`));
      
      // Check all users
      const usersResult = await pool.query('SELECT id, name, email FROM users ORDER BY id');
      console.log('\n👥 All Users:');
      usersResult.rows.forEach(user => console.log(`  - ${user.name} (${user.email}) - ID: ${user.id}`));
      
      return;
    }

    console.log('✅ SUPER_ADMIN Users Found:');
    superAdminResult.rows.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ID: ${user.id} - Role: ${user.role_name}`);
    });

    // Check Iqama permissions for the first super admin
    const superAdmin = superAdminResult.rows[0];
    console.log(`\n🔐 Checking Iqama Permissions for ${superAdmin.name}:`);

    const iqamaPermissionsResult = await pool.query(`
      SELECT DISTINCT p.name as permission_name
      FROM permissions p
      JOIN role_has_permissions rhp ON p.id = rhp.permission_id
      JOIN roles r ON rhp.role_id = r.id
      JOIN model_has_roles mhr ON r.id = mhr.role_id
      WHERE mhr.user_id = $1 
      AND (p.name LIKE '%iqama%' OR p.name LIKE '%Iqama%')
      ORDER BY p.name
    `, [superAdmin.id]);

    console.log('✅ Iqama Permissions:');
    if (iqamaPermissionsResult.rows.length === 0) {
      console.log('  ❌ No Iqama permissions found for SUPER_ADMIN');
    } else {
      iqamaPermissionsResult.rows.forEach(perm => {
        console.log(`  - ${perm.permission_name}`);
      });
    }

    // Check specific dashboard permissions
    const dashboardPermissions = [
      'read.Employee', // for iqama section
      'manage.Iqama',  // for iqamaManagement section
    ];

    console.log('\n🎯 Dashboard Section Permissions:');
    for (const requiredPerm of dashboardPermissions) {
      const hasPermissionResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM permissions p
        JOIN role_has_permissions rhp ON p.id = rhp.permission_id
        JOIN roles r ON rhp.role_id = r.id
        JOIN model_has_roles mhr ON r.id = mhr.role_id
        WHERE mhr.user_id = $1 AND p.name = $2
      `, [superAdmin.id, requiredPerm]);

      const hasPermission = hasPermissionResult.rows[0].count > 0;
      console.log(`  ${requiredPerm}: ${hasPermission ? '✅ YES' : '❌ NO'}`);
    }

  } catch (error) {
    console.error('❌ Error finding super admin:', error);
  } finally {
    await pool.end();
  }
}

findSuperAdmin();
