const { Pool } = require('pg');
require('dotenv').config();

async function addIqamaPermissions() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔐 Adding Iqama Permissions...\n');

    // Iqama permissions to add
    const iqamaPermissions = [
      'create.Iqama',
      'read.Iqama',
      'update.Iqama',
      'delete.Iqama',
      'manage.Iqama',
      'approve.Iqama',
      'reject.Iqama',
      'renew.Iqama',
      'expire.Iqama',
      'create.iqama-application',
      'read.iqama-application',
      'update.iqama-application',
      'delete.iqama-application',
      'manage.iqama-application',
      'create.iqama-renewal',
      'read.iqama-renewal',
      'update.iqama-renewal',
      'delete.iqama-renewal',
      'manage.iqama-renewal',
      'create.iqama-expiry',
      'read.iqama-expiry',
      'update.iqama-expiry',
      'delete.iqama-expiry',
      'manage.iqama-expiry'
    ];

    // Add permissions
    console.log('📝 Adding Iqama permissions to database...');
    for (const permissionName of iqamaPermissions) {
      try {
        const insertQuery = `
          INSERT INTO permissions (name, guard_name, created_at, updated_at)
          VALUES ($1, 'web', NOW(), NOW())
          ON CONFLICT (name) DO NOTHING
        `;
        
        await pool.query(insertQuery, [permissionName]);
        console.log(`   ✅ Added permission: ${permissionName}`);
      } catch (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`   ⚠️ Permission already exists: ${permissionName}`);
        } else {
          console.error(`   ❌ Error adding permission ${permissionName}:`, error.message);
        }
      }
    }

    // Assign Iqama permissions to roles
    console.log('\n🔗 Assigning Iqama permissions to roles...');
    
    const roleIqamaPermissions = {
      'SUPER_ADMIN': iqamaPermissions, // Full access
      'ADMIN': ['manage.Iqama', 'create.Iqama', 'read.Iqama', 'update.Iqama', 'delete.Iqama', 'approve.Iqama', 'reject.Iqama', 'renew.Iqama', 'expire.Iqama'],
      'MANAGER': ['manage.Iqama', 'create.Iqama', 'read.Iqama', 'update.Iqama', 'approve.Iqama', 'renew.Iqama'],
      'SUPERVISOR': ['manage.Iqama', 'read.Iqama', 'update.Iqama', 'approve.Iqama', 'renew.Iqama'],
      'OPERATOR': ['read.Iqama', 'read.iqama-expiry'],
      'EMPLOYEE': ['read.Iqama'],
      'USER': ['read.Iqama']
    };

    for (const [roleName, permissions] of Object.entries(roleIqamaPermissions)) {
      console.log(`\n👥 Assigning Iqama permissions to role: ${roleName}`);
      
      // Get role ID
      const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1', [roleName]);
      if (roleResult.rows.length === 0) {
        console.log(`   ⚠️ Role not found: ${roleName}`);
        continue;
      }
      
      const roleId = roleResult.rows[0].id;
      
      // Get permission IDs
      const permissionIds = [];
      for (const permissionName of permissions) {
        const permResult = await pool.query('SELECT id FROM permissions WHERE name = $1', [permissionName]);
        if (permResult.rows.length > 0) {
          permissionIds.push(permResult.rows[0].id);
        }
      }
      
      // Assign permissions to role
      for (const permissionId of permissionIds) {
        try {
          const assignQuery = `
            INSERT INTO role_has_permissions (role_id, permission_id)
            VALUES ($1, $2)
            ON CONFLICT (role_id, permission_id) DO NOTHING
          `;
          
          await pool.query(assignQuery, [roleId, permissionId]);
          console.log(`   ✅ Assigned permission ID ${permissionId} to ${roleName}`);
        } catch (error) {
          if (error.code === '23505') { // Unique constraint violation
            console.log(`   ⚠️ Permission already assigned: ${permissionId} to ${roleName}`);
          } else {
            console.error(`   ❌ Error assigning permission ${permissionId} to ${roleName}:`, error.message);
          }
        }
      }
    }

    console.log('\n🎉 Iqama permissions setup completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Added ${iqamaPermissions.length} Iqama permissions`);
    console.log(`   - Assigned permissions to ${Object.keys(roleIqamaPermissions).length} roles`);

  } catch (error) {
    console.error('❌ Error in Iqama permissions setup:', error);
  } finally {
    await pool.end();
  }
}

// Run the function
addIqamaPermissions();
