const { Pool } = require('pg');
require('dotenv').config();

async function assignMissingPermissionsToSuperAdmin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔧 Assigning Missing Permissions to SUPER_ADMIN...\n');

    // Get SUPER_ADMIN role ID
    const roleResult = await pool.query(`
      SELECT id FROM roles WHERE name = 'SUPER_ADMIN'
    `);

    if (roleResult.rows.length === 0) {
      console.log('❌ SUPER_ADMIN role not found');
      return;
    }

    const superAdminRoleId = roleResult.rows[0].id;
    console.log(`✅ Found SUPER_ADMIN role with ID: ${superAdminRoleId}\n`);

    // Get all required permissions for dashboard sections
    const requiredPermissions = [
      'read.Employee',      // for iqama, myTeam, manualAssignments sections
      'read.Equipment',     // for equipment section
      'read.Payroll',       // for financial section
      'read.Timesheet',     // for timesheets section
      'read.Project',       // for projectOverview section
      'read.Settings',      // for quickActions, recentActivity sections
      'read.AdvancePayment' // for employeeAdvance section
    ];

    console.log('📋 Required Permissions:');
    requiredPermissions.forEach(perm => console.log(`  - ${perm}`));

    // Get permission IDs
    const permissionIds = [];
    for (const permissionName of requiredPermissions) {
      const permResult = await pool.query(`
        SELECT id FROM permissions WHERE name = $1
      `, [permissionName]);

      if (permResult.rows.length > 0) {
        permissionIds.push(permResult.rows[0].id);
        console.log(`✅ Found permission: ${permissionName} (ID: ${permResult.rows[0].id})`);
      } else {
        console.log(`❌ Permission not found: ${permissionName}`);
      }
    }

    console.log('\n🔗 Assigning permissions to SUPER_ADMIN role...');

    let assignedCount = 0;
    for (const permissionId of permissionIds) {
      // Check if permission is already assigned
      const existingResult = await pool.query(`
        SELECT COUNT(*) as count 
        FROM role_has_permissions 
        WHERE role_id = $1 AND permission_id = $2
      `, [superAdminRoleId, permissionId]);

      if (existingResult.rows[0].count === 0) {
        // Assign permission
        await pool.query(`
          INSERT INTO role_has_permissions (role_id, permission_id)
          VALUES ($1, $2)
        `, [superAdminRoleId, permissionId]);

        console.log(`✅ Assigned permission ID: ${permissionId}`);
        assignedCount++;
      } else {
        console.log(`ℹ️  Permission ID ${permissionId} already assigned`);
      }
    }

    console.log(`\n📊 Summary: ${assignedCount} new permissions assigned to SUPER_ADMIN`);

    // Verify the assignments
    console.log('\n🔍 Verifying SUPER_ADMIN permissions...');
    const verifyResult = await pool.query(`
      SELECT p.name as permission_name
      FROM permissions p
      JOIN role_has_permissions rhp ON p.id = rhp.permission_id
      WHERE rhp.role_id = $1
      ORDER BY p.name
    `, [superAdminRoleId]);

    console.log('✅ SUPER_ADMIN now has these permissions:');
    verifyResult.rows.forEach(row => {
      console.log(`  - ${row.permission_name}`);
    });

  } catch (error) {
    console.error('❌ Error assigning permissions:', error);
  } finally {
    await pool.end();
  }
}

assignMissingPermissionsToSuperAdmin();
