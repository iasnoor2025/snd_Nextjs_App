const { Pool } = require('pg');
require('dotenv').config();

async function testPermissions() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🧪 Testing Permission System...\n');

    // Test 1: Check if a user has the required permissions
    console.log('1️⃣ Testing user permissions for admin@ias.com...');
    
    const userQuery = `
      SELECT u.id, u.email, u.name, r.name as role_name
      FROM users u
      LEFT JOIN model_has_roles mhr ON u.id = mhr.user_id
      LEFT JOIN roles r ON mhr.role_id = r.id
      WHERE u.email = 'admin@ias.com'
    `;
    
    const userResult = await pool.query(userQuery);
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log(`   User: ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role_name || 'No role assigned'}`);
      
      // Check user's permissions
      const permissionsQuery = `
        SELECT DISTINCT p.name as permission_name
        FROM model_has_roles mhr
        JOIN role_has_permissions rhp ON mhr.role_id = rhp.role_id
        JOIN permissions p ON rhp.permission_id = p.id
        WHERE mhr.user_id = $1
        ORDER BY p.name
      `;
      
      const permissionsResult = await pool.query(permissionsQuery, [user.id]);
      console.log(`   Permissions: ${permissionsResult.rows.length} total`);
      
      // Check for specific permissions we need
      const requiredPermissions = ['read.employee-data', 'manage.employee-data'];
      const userPermissions = permissionsResult.rows.map(p => p.permission_name);
      
      requiredPermissions.forEach(permission => {
        const hasPermission = userPermissions.includes(permission);
        console.log(`   ${hasPermission ? '✅' : '❌'} ${permission}`);
      });
      
    } else {
      console.log('   ❌ User admin@ias.com not found');
    }

    // Test 2: Check role-permission mappings
    console.log('\n2️⃣ Testing role-permission mappings...');
    
    const rolePermissionsQuery = `
      SELECT r.name as role_name, p.name as permission_name
      FROM roles r
      JOIN role_has_permissions rhp ON r.id = rhp.role_id
      JOIN permissions p ON rhp.permission_id = p.id
      WHERE r.name IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
      ORDER BY r.name, p.name
      LIMIT 20
    `;
    
    const rolePermissionsResult = await pool.query(rolePermissionsQuery);
    console.log(`   Found ${rolePermissionsResult.rows.length} role-permission mappings`);
    
    // Group by role
    const rolePermissions = {};
    rolePermissionsResult.rows.forEach(row => {
      if (!rolePermissions[row.role_name]) {
        rolePermissions[row.role_name] = [];
      }
      rolePermissions[row.role_name].push(row.permission_name);
    });
    
    Object.keys(rolePermissions).forEach(role => {
      console.log(`   ${role}: ${rolePermissions[role].length} permissions`);
    });

    // Test 3: Check if the permission mapping system would work
    console.log('\n3️⃣ Testing permission mapping compatibility...');
    
    const apiPermissions = [
      'read.Employee', 'create.Employee', 'update.Employee', 'delete.Employee',
      'read.User', 'create.User', 'update.User', 'delete.User',
      'read.Customer', 'create.Customer', 'update.Customer', 'delete.Customer'
    ];
    
    const databasePermissions = [
      'read.employee-data', 'create.employee-data', 'update.employee-data', 'delete.employee-data',
      'read.user', 'create.user', 'update.user', 'delete.user',
      'read.customer', 'create.customer', 'update.customer', 'delete.customer'
    ];
    
    console.log('   API Permission -> Database Permission mapping:');
    apiPermissions.forEach((apiPerm, index) => {
      const dbPerm = databasePermissions[index];
      console.log(`   ${apiPerm} -> ${dbPerm}`);
    });

    // Test 4: Check if there are any missing critical permissions
    console.log('\n4️⃣ Checking for missing critical permissions...');
    
    const criticalPermissions = [
      'read.employee-data', 'manage.employee-data',
      'read.user', 'manage.user',
      'read.customer', 'manage.customer',
      'read.equipment', 'manage.equipment',
      'read.project', 'manage.project',
      'read.timesheet', 'manage.timesheet'
    ];
    
    const existingPermissionsQuery = `
      SELECT name FROM permissions 
      WHERE name IN (${criticalPermissions.map((_, i) => `$${i + 1}`).join(', ')})
    `;
    
    const existingPermissionsResult = await pool.query(existingPermissionsQuery, criticalPermissions);
    const existingPermissions = existingPermissionsResult.rows.map(p => p.name);
    
    const missingPermissions = criticalPermissions.filter(p => !existingPermissions.includes(p));
    
    if (missingPermissions.length > 0) {
      console.log('   ❌ Missing critical permissions:');
      missingPermissions.forEach(p => console.log(`      ${p}`));
    } else {
      console.log('   ✅ All critical permissions exist');
    }

    console.log('\n✅ Permission system test completed!');
    
  } catch (error) {
    console.error('❌ Error testing permissions:', error);
  } finally {
    await pool.end();
  }
}

testPermissions();
