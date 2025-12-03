const { Pool } = require('pg');
require('dotenv').config();

async function debugSuperAdminRoleAssignment() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Debugging Super Admin Role Assignment...\n');

    // Check user 2 (IAS Admin)
    const userResult = await pool.query(`
      SELECT id, name, email FROM users WHERE id = 2
    `);

    if (userResult.rows.length === 0) {
      console.log('❌ User ID 2 not found');
      return;
    }

    const user = userResult.rows[0];
    console.log(`👤 User: ${user.name} (${user.email}) - ID: ${user.id}\n`);

    // Check user's roles
    const rolesResult = await pool.query(`
      SELECT r.id, r.name as role_name
      FROM roles r
      JOIN model_has_roles mhr ON r.id = mhr.role_id
      WHERE mhr.user_id = $1
    `, [user.id]);

    console.log('📋 User Roles:');
    if (rolesResult.rows.length === 0) {
      console.log('  ❌ No roles assigned to user');
    } else {
      rolesResult.rows.forEach(role => {
        console.log(`  - ${role.role_name} (ID: ${role.id})`);
      });
    }

    // Check SUPER_ADMIN role permissions
    const superAdminRoleResult = await pool.query(`
      SELECT id FROM roles WHERE name = 'SUPER_ADMIN'
    `);

    if (superAdminRoleResult.rows.length === 0) {
      console.log('\n❌ SUPER_ADMIN role not found');
      return;
    }

    const superAdminRoleId = superAdminRoleResult.rows[0].id;
    console.log(`\n🔐 SUPER_ADMIN Role ID: ${superAdminRoleId}`);

    // Check if user has SUPER_ADMIN role
    const userHasSuperAdminRole = await pool.query(`
      SELECT COUNT(*) as count
      FROM model_has_roles mhr
      WHERE mhr.user_id = $1 AND mhr.role_id = $2
    `, [user.id, superAdminRoleId]);

    console.log(`\n🔗 User has SUPER_ADMIN role: ${userHasSuperAdminRole.rows[0].count > 0 ? '✅ YES' : '❌ NO'}`);

    // Check SUPER_ADMIN role permissions
    const superAdminPermissionsResult = await pool.query(`
      SELECT p.name as permission_name
      FROM permissions p
      JOIN role_has_permissions rhp ON p.id = rhp.permission_id
      WHERE rhp.role_id = $1
      ORDER BY p.name
    `, [superAdminRoleId]);

    console.log('\n🔑 SUPER_ADMIN Role Permissions:');
    superAdminPermissionsResult.rows.forEach(row => {
      console.log(`  - ${row.permission_name}`);
    });

    // Check specific permissions for the user
    const specificPermissions = ['read.Employee', 'manage.Iqama'];
    
    console.log('\n🎯 Checking Specific Permissions for User:');
    for (const permission of specificPermissions) {
      const hasPermissionResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM permissions p
        JOIN role_has_permissions rhp ON p.id = rhp.permission_id
        JOIN roles r ON rhp.role_id = r.id
        JOIN model_has_roles mhr ON r.id = mhr.role_id
        WHERE mhr.user_id = $1 AND p.name = $2
      `, [user.id, permission]);

      const hasPermission = hasPermissionResult.rows[0].count > 0;
      console.log(`  ${permission}: ${hasPermission ? '✅ YES' : '❌ NO'}`);
    }

  } catch (error) {
    console.error('❌ Error debugging role assignment:', error);
  } finally {
    await pool.end();
  }
}

debugSuperAdminRoleAssignment();
