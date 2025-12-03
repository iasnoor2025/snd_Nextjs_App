const { Pool } = require('pg');
require('dotenv').config();

async function assignIqamaPermissionsToRoles() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔐 Assigning Iqama Permissions to Roles...\n');

    // Get all Iqama permissions
    const iqamaPermissionsResult = await pool.query(`
      SELECT id, name FROM permissions 
      WHERE name LIKE '%Iqama%' OR name LIKE '%iqama%'
      ORDER BY name
    `);

    const iqamaPermissions = iqamaPermissionsResult.rows;
    console.log(`Found ${iqamaPermissions.length} Iqama permissions:`);
    iqamaPermissions.forEach(perm => console.log(`  - ${perm.name}`));

    // Get all roles
    const rolesResult = await pool.query(`
      SELECT id, name FROM roles 
      WHERE name IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR')
      ORDER BY name
    `);

    const roles = rolesResult.rows;
    console.log(`\nFound ${roles.length} roles:`);
    roles.forEach(role => console.log(`  - ${role.name}`));

    // Define which permissions each role should have
    const rolePermissions = {
      'SUPER_ADMIN': iqamaPermissions.map(p => p.name), // All permissions
      'ADMIN': [
        'read.Iqama', 'create.Iqama', 'update.Iqama', 'delete.Iqama', 'manage.Iqama',
        'approve.Iqama', 'reject.Iqama', 'renew.Iqama', 'expire.Iqama',
        'create.iqama-application', 'read.iqama-application', 'update.iqama-application', 'delete.iqama-application', 'manage.iqama-application',
        'create.iqama-renewal', 'read.iqama-renewal', 'update.iqama-renewal', 'delete.iqama-renewal', 'manage.iqama-renewal',
        'create.iqama-expiry', 'read.iqama-expiry', 'update.iqama-expiry', 'delete.iqama-expiry', 'manage.iqama-expiry'
      ],
      'MANAGER': [
        'read.Iqama', 'create.Iqama', 'update.Iqama', 'manage.Iqama',
        'approve.Iqama', 'reject.Iqama', 'renew.Iqama',
        'read.iqama-application', 'update.iqama-application', 'manage.iqama-application',
        'read.iqama-renewal', 'update.iqama-renewal', 'manage.iqama-renewal',
        'read.iqama-expiry', 'update.iqama-expiry', 'manage.iqama-expiry'
      ],
      'SUPERVISOR': [
        'read.Iqama', 'update.Iqama',
        'approve.Iqama', 'renew.Iqama',
        'read.iqama-application', 'update.iqama-application',
        'read.iqama-renewal', 'update.iqama-renewal',
        'read.iqama-expiry', 'update.iqama-expiry'
      ],
      'OPERATOR': [
        'read.Iqama',
        'read.iqama-application',
        'read.iqama-renewal',
        'read.iqama-expiry'
      ]
    };

    // Assign permissions to roles
    for (const role of roles) {
      console.log(`\n📋 Assigning permissions to role: ${role.name}`);
      
      const permissionsToAssign = rolePermissions[role.name] || [];
      
      for (const permissionName of permissionsToAssign) {
        const permission = iqamaPermissions.find(p => p.name === permissionName);
        if (permission) {
          try {
            // Check if role_permission already exists
            const existingResult = await pool.query(`
              SELECT permission_id FROM role_has_permissions 
              WHERE role_id = $1 AND permission_id = $2
            `, [role.id, permission.id]);

            if (existingResult.rows.length === 0) {
              // Insert new role_permission
              await pool.query(`
                INSERT INTO role_has_permissions (role_id, permission_id)
                VALUES ($1, $2)
              `, [role.id, permission.id]);
              console.log(`  ✅ Added: ${permissionName}`);
            } else {
              console.log(`  ⏭️  Already exists: ${permissionName}`);
            }
          } catch (error) {
            console.error(`  ❌ Error assigning ${permissionName}:`, error.message);
          }
        } else {
          console.log(`  ⚠️  Permission not found: ${permissionName}`);
        }
      }
    }

    console.log('\n🎉 Iqama permissions assignment completed!');
    
    // Verify assignments
    console.log('\n📊 Verification - Permissions by role:');
    for (const role of roles) {
      const permissionsResult = await pool.query(`
        SELECT p.name 
        FROM permissions p
        JOIN role_has_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = $1 AND (p.name LIKE '%Iqama%' OR p.name LIKE '%iqama%')
        ORDER BY p.name
      `, [role.id]);
      
      console.log(`\n${role.name}:`);
      permissionsResult.rows.forEach(perm => console.log(`  - ${perm.name}`));
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
assignIqamaPermissionsToRoles();
