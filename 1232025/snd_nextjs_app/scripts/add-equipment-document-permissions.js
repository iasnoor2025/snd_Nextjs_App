const { Pool } = require('pg');
require('dotenv').config();

async function addEquipmentDocumentPermissions() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔧 Adding Equipment Document Permissions...\n');

    // Equipment document permissions to add
    const equipmentDocumentPermissions = [
      'create.equipment-document',
      'read.equipment-document', 
      'update.equipment-document',
      'delete.equipment-document',
      'manage.equipment-document'
    ];

    // Add permissions
    console.log('📝 Adding permissions to database...');
    for (const permissionName of equipmentDocumentPermissions) {
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

    // Assign permissions to roles
    console.log('\n🔗 Assigning permissions to roles...');
    
    const rolePermissions = {
      'SUPER_ADMIN': equipmentDocumentPermissions, // Full access
      'ADMIN': ['manage.equipment-document'], // Manage access
      'MANAGER': ['manage.equipment-document'], // Manage access
      'SUPERVISOR': ['read.equipment-document'], // Read access
      'OPERATOR': ['read.equipment-document'], // Read access
      'EMPLOYEE': ['read.equipment-document'], // Read access
      'USER': ['read.equipment-document'] // Read access
    };

    for (const [roleName, permissions] of Object.entries(rolePermissions)) {
      try {
        // Get role ID
        const roleQuery = `SELECT id FROM roles WHERE name = $1`;
        const roleResult = await pool.query(roleQuery, [roleName]);
        
        if (roleResult.rows.length === 0) {
          console.log(`   ⚠️ Role not found: ${roleName}`);
          continue;
        }
        
        const roleId = roleResult.rows[0].id;
        
        // Assign each permission to the role
        for (const permissionName of permissions) {
          try {
            // Get permission ID
            const permQuery = `SELECT id FROM permissions WHERE name = $1`;
            const permResult = await pool.query(permQuery, [permissionName]);
            
            if (permResult.rows.length === 0) {
              console.log(`   ⚠️ Permission not found: ${permissionName}`);
              continue;
            }
            
            const permissionId = permResult.rows[0].id;
            
            // Assign permission to role
            const assignQuery = `
              INSERT INTO role_has_permissions (role_id, permission_id)
              VALUES ($1, $2)
              ON CONFLICT (role_id, permission_id) DO NOTHING
            `;
            
            await pool.query(assignQuery, [roleId, permissionId]);
            console.log(`   ✅ Assigned ${permissionName} to ${roleName}`);
          } catch (error) {
            if (error.code === '23505') { // Unique constraint violation
              console.log(`   ⚠️ Permission already assigned: ${permissionName} to ${roleName}`);
            } else {
              console.error(`   ❌ Error assigning ${permissionName} to ${roleName}:`, error.message);
            }
          }
        }
      } catch (error) {
        console.error(`   ❌ Error processing role ${roleName}:`, error.message);
      }
    }

    console.log('\n🎉 Equipment document permissions setup completed!');
    
    // Verify the setup
    console.log('\n🔍 Verifying setup...');
    const verifyQuery = `
      SELECT r.name as role_name, p.name as permission_name
      FROM roles r
      JOIN role_has_permissions rhp ON r.id = rhp.role_id
      JOIN permissions p ON rhp.permission_id = p.id
      WHERE p.name LIKE '%equipment-document%'
      ORDER BY r.name, p.name
    `;
    
    const verifyResult = await pool.query(verifyQuery);
    console.log(`   Found ${verifyResult.rows.length} equipment document permission assignments:`);
    
    const rolePerms = {};
    verifyResult.rows.forEach(row => {
      if (!rolePerms[row.role_name]) {
        rolePerms[row.role_name] = [];
      }
      rolePerms[row.role_name].push(row.permission_name);
    });
    
    Object.keys(rolePerms).forEach(role => {
      console.log(`   ${role}: ${rolePerms[role].join(', ')}`);
    });

  } catch (error) {
    console.error('❌ Error setting up equipment document permissions:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the setup
if (require.main === module) {
  addEquipmentDocumentPermissions()
    .then(() => {
      console.log('✅ Equipment document permissions setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Equipment document permissions setup failed:', error);
      process.exit(1);
    });
}

module.exports = { addEquipmentDocumentPermissions };
