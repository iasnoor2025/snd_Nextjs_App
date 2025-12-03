const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'snd_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

// Document management permissions to add
const documentPermissions = [
  // Document permissions
  { name: 'read.document', guard_name: 'web', created_at: new Date(), updated_at: new Date() },
  { name: 'create.document', guard_name: 'web', created_at: new Date(), updated_at: new Date() },
  { name: 'update.document', guard_name: 'web', created_at: new Date(), updated_at: new Date() },
  { name: 'delete.document', guard_name: 'web', created_at: new Date(), updated_at: new Date() },
  { name: 'manage.document', guard_name: 'web', created_at: new Date(), updated_at: new Date() },
  { name: 'upload.document', guard_name: 'web', created_at: new Date(), updated_at: new Date() },
  { name: 'download.document', guard_name: 'web', created_at: new Date(), updated_at: new Date() },
  { name: 'approve.document', guard_name: 'web', created_at: new Date(), updated_at: new Date() },
  { name: 'reject.document', guard_name: 'web', created_at: new Date(), updated_at: new Date() },

  // Document version permissions
  { name: 'read.document-version', guard_name: 'web', created_at: new Date(), updated_at: new Date() },
  { name: 'create.document-version', guard_name: 'web', created_at: new Date(), updated_at: new Date() },
  { name: 'update.document-version', guard_name: 'web', created_at: new Date(), updated_at: new Date() },
  { name: 'delete.document-version', guard_name: 'web', created_at: new Date(), updated_at: new Date() },
  { name: 'manage.document-version', guard_name: 'web', created_at: new Date(), updated_at: new Date() },

  // Document approval permissions
  { name: 'read.document-approval', guard_name: 'web', created_at: new Date(), updated_at: new Date() },
  { name: 'create.document-approval', guard_name: 'web', created_at: new Date(), updated_at: new Date() },
  { name: 'update.document-approval', guard_name: 'web', created_at: new Date(), updated_at: new Date() },
  { name: 'delete.document-approval', guard_name: 'web', created_at: new Date(), updated_at: new Date() },
  { name: 'manage.document-approval', guard_name: 'web', created_at: new Date(), updated_at: new Date() },
  { name: 'approve.document-approval', guard_name: 'web', created_at: new Date(), updated_at: new Date() },
  { name: 'reject.document-approval', guard_name: 'web', created_at: new Date(), updated_at: new Date() },
];

async function setupDocumentPermissions() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Setting up document management permissions...');
    
    // Check if permissions table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'permissions'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ Permissions table does not exist. Please run the RBAC setup first.');
      return;
    }
    
    // Add each permission
    for (const permission of documentPermissions) {
      try {
        // Check if permission already exists
        const existingPermission = await client.query(
          'SELECT id FROM permissions WHERE name = $1',
          [permission.name]
        );
        
        if (existingPermission.rows.length > 0) {
          console.log(`✅ Permission ${permission.name} already exists`);
          continue;
        }
        
        // Insert new permission
        const result = await client.query(
          'INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES ($1, $2, $3, $4) RETURNING id',
          [permission.name, permission.guard_name, permission.created_at, permission.updated_at]
        );
        
        console.log(`✅ Added permission: ${permission.name} (ID: ${result.rows[0].id})`);
        
      } catch (error) {
        console.error(`❌ Error adding permission ${permission.name}:`, error.message);
      }
    }
    
    // Update role permissions for existing roles
    const rolesToUpdate = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'EMPLOYEE', 'USER'];
    
    for (const roleName of rolesToUpdate) {
      try {
        // Get role ID
        const roleResult = await client.query(
          'SELECT id FROM roles WHERE name = $1',
          [roleName]
        );
        
        if (roleResult.rows.length === 0) {
          console.log(`⚠️ Role ${roleName} not found, skipping...`);
          continue;
        }
        
        const roleId = roleResult.rows[0].id;
        
        // Get permissions for this role
        const permissionsResult = await client.query(`
          SELECT p.name 
          FROM permissions p
          JOIN role_has_permissions rhp ON p.id = rhp.permission_id
          WHERE rhp.role_id = $1
        `, [roleId]);
        
        const existingPermissions = permissionsResult.rows.map(row => row.name);
        
        // Determine which permissions to add based on role
        let permissionsToAdd = [];
        
        switch (roleName) {
          case 'SUPER_ADMIN':
            permissionsToAdd = documentPermissions.map(p => p.name);
            break;
          case 'ADMIN':
            permissionsToAdd = documentPermissions.map(p => p.name);
            break;
          case 'MANAGER':
            permissionsToAdd = [
              'read.document', 'create.document', 'update.document', 'delete.document', 'manage.document',
              'upload.document', 'download.document', 'approve.document', 'reject.document',
              'read.document-version', 'read.document-approval'
            ];
            break;
          case 'SUPERVISOR':
            permissionsToAdd = [
              'read.document', 'read.document-version', 'read.document-approval'
            ];
            break;
          case 'OPERATOR':
            permissionsToAdd = [
              'read.document', 'read.document-version', 'read.document-approval'
            ];
            break;
          case 'EMPLOYEE':
            permissionsToAdd = [
              'read.document', 'read.document-version', 'read.document-approval'
            ];
            break;
          case 'USER':
            permissionsToAdd = [
              'read.document', 'read.document-version', 'read.document-approval'
            ];
            break;
        }
        
        // Add missing permissions
        for (const permissionName of permissionsToAdd) {
          if (!existingPermissions.includes(permissionName)) {
            // Get permission ID
            const permResult = await client.query(
              'SELECT id FROM permissions WHERE name = $1',
              [permissionName]
            );
            
            if (permResult.rows.length > 0) {
              const permissionId = permResult.rows[0].id;
              
              // Add role-permission relationship
              await client.query(
                'INSERT INTO role_has_permissions (role_id, permission_id) VALUES ($1, $2)',
                [roleId, permissionId]
              );
              
              console.log(`✅ Added ${permissionName} permission to role ${roleName}`);
            }
          }
        }
        
      } catch (error) {
        console.error(`❌ Error updating role ${roleName}:`, error.message);
      }
    }
    
    console.log('🎉 Document management permissions setup completed!');
    
  } catch (error) {
    console.error('❌ Error setting up document permissions:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
setupDocumentPermissions().catch(console.error);
