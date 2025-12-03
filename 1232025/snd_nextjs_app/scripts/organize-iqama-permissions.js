const { Pool } = require('pg');
require('dotenv').config();

async function organizeIqamaPermissions() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔐 Organizing Iqama Permissions into Groups...\n');

    // Define all Iqama-related permissions
    const iqamaPermissions = [
      // Core Iqama permissions
      'create.Iqama',
      'read.Iqama', 
      'update.Iqama',
      'delete.Iqama',
      'manage.Iqama',
      'approve.Iqama',
      'reject.Iqama',
      'renew.Iqama',
      'expire.Iqama',
      
      // Iqama Application permissions
      'create.iqama-application',
      'read.iqama-application',
      'update.iqama-application',
      'delete.iqama-application',
      'manage.iqama-application',
      
      // Iqama Renewal permissions
      'create.iqama-renewal',
      'read.iqama-renewal',
      'update.iqama-renewal',
      'delete.iqama-renewal',
      'manage.iqama-renewal',
      
      // Iqama Expiry permissions
      'create.iqama-expiry',
      'read.iqama-expiry',
      'update.iqama-expiry',
      'delete.iqama-expiry',
      'manage.iqama-expiry'
    ];

    console.log(`📋 Total Iqama permissions to organize: ${iqamaPermissions.length}`);

    // Check which permissions already exist
    const existingPermissionsResult = await pool.query(`
      SELECT name FROM permissions 
      WHERE name IN (${iqamaPermissions.map((_, i) => `$${i + 1}`).join(', ')})
    `, iqamaPermissions);

    const existingPermissions = existingPermissionsResult.rows.map(row => row.name);
    console.log(`✅ Found ${existingPermissions.length} existing Iqama permissions:`);
    existingPermissions.forEach(perm => console.log(`  - ${perm}`));

    // Add missing permissions
    const missingPermissions = iqamaPermissions.filter(perm => !existingPermissions.includes(perm));
    
    if (missingPermissions.length > 0) {
      console.log(`\n📝 Adding ${missingPermissions.length} missing Iqama permissions:`);
      
      for (const permissionName of missingPermissions) {
        try {
          await pool.query(`
            INSERT INTO permissions (name, guard_name, created_at, updated_at)
            VALUES ($1, 'web', NOW(), NOW())
          `, [permissionName]);
          console.log(`  ✅ Added: ${permissionName}`);
        } catch (error) {
          console.log(`  ⚠️  Already exists or error: ${permissionName}`);
        }
      }
    } else {
      console.log('\n✅ All Iqama permissions already exist in database');
    }

    // Get all Iqama permissions with their IDs
    const allIqamaPermissionsResult = await pool.query(`
      SELECT id, name FROM permissions 
      WHERE name IN (${iqamaPermissions.map((_, i) => `$${i + 1}`).join(', ')})
      ORDER BY name
    `, iqamaPermissions);

    const allIqamaPermissions = allIqamaPermissionsResult.rows;
    console.log(`\n📊 Total Iqama permissions in database: ${allIqamaPermissions.length}`);

    // Assign permissions to roles based on hierarchy
    const roleAssignments = {
      'SUPER_ADMIN': allIqamaPermissions.map(p => p.name), // All permissions
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

    // Get roles
    const rolesResult = await pool.query(`
      SELECT id, name FROM roles 
      WHERE name IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR')
      ORDER BY name
    `);

    const roles = rolesResult.rows;
    console.log(`\n👥 Found ${roles.length} roles to assign permissions to`);

    // Assign permissions to roles
    for (const role of roles) {
      console.log(`\n📋 Assigning permissions to role: ${role.name}`);
      
      const permissionsToAssign = roleAssignments[role.name] || [];
      
      for (const permissionName of permissionsToAssign) {
        const permission = allIqamaPermissions.find(p => p.name === permissionName);
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

    console.log('\n🎉 Iqama permissions organization completed!');
    
    // Final verification
    console.log('\n📊 Final Verification - Iqama permissions by role:');
    for (const role of roles) {
      const permissionsResult = await pool.query(`
        SELECT p.name 
        FROM permissions p
        JOIN role_has_permissions rhp ON p.id = rhp.permission_id
        WHERE rhp.role_id = $1 AND (p.name LIKE '%Iqama%' OR p.name LIKE '%iqama%')
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
organizeIqamaPermissions();
