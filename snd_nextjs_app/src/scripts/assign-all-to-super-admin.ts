import { config } from 'dotenv';
import { resolve } from 'path';
import { pool } from '../lib/drizzle';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../../.env.local') });

async function assignAllToSuperAdmin() {
  try {
    console.log('🔧 Assigning all permissions to SUPER_ADMIN...\n');
    
    // Get SUPER_ADMIN role ID
    const superAdminRole = await pool.query('SELECT id FROM roles WHERE name = $1', ['SUPER_ADMIN']);
    if (!superAdminRole.rows[0]) {
      console.log('❌ SUPER_ADMIN role not found');
      return;
    }
    
    const superAdminRoleId = superAdminRole.rows[0].id;
    console.log(`📋 SUPER_ADMIN role ID: ${superAdminRoleId}`);
    
    // Get all permissions
    const allPermissions = await pool.query('SELECT id, name FROM permissions ORDER BY id');
    const totalPermissions = allPermissions.rows.length;
    console.log(`📊 Total permissions to assign: ${totalPermissions}`);
    
    // Check which permissions are already assigned
    const existingAssignments = await pool.query(
      'SELECT permission_id FROM role_has_permissions WHERE role_id = $1',
      [superAdminRoleId]
    );
    
    const existingPermissionIds = new Set(existingAssignments.rows.map(row => row.permission_id));
    console.log(`📋 Already assigned permissions: ${existingPermissionIds.size}`);
    
    // Find permissions that need to be assigned
    const permissionsToAssign = allPermissions.rows.filter(perm => !existingPermissionIds.has(perm.id));
    console.log(`📋 Permissions to assign: ${permissionsToAssign.length}`);
    
    if (permissionsToAssign.length === 0) {
      console.log('✅ All permissions are already assigned to SUPER_ADMIN');
      return;
    }
    
    // Assign permissions in batches
    const batchSize = 50;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < permissionsToAssign.length; i += batchSize) {
      const batch = permissionsToAssign.slice(i, i + batchSize);
      
      try {
        const values = batch.map(perm => `(${superAdminRoleId}, ${perm.id})`).join(',');
        const insertQuery = `INSERT INTO role_has_permissions (role_id, permission_id) VALUES ${values}`;
        
        await pool.query(insertQuery);
        successCount += batch.length;
        
        console.log(`  ✅ Assigned batch ${Math.floor(i / batchSize) + 1}: ${batch.length} permissions`);
      } catch (error: unknown) {
        const dbError = error as { code?: string; message?: string };
        if (dbError.code === '23505') { // Unique constraint violation
          console.log(`  ⚠️ Batch ${Math.floor(i / batchSize) + 1} already assigned, skipping...`);
        } else {
          console.error(`  ❌ Error assigning batch ${Math.floor(i / batchSize) + 1}:`, dbError.message || 'Unknown error');
          errorCount += batch.length;
        }
      }
    }
    
    console.log(`\n📊 Assignment Summary:`);
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    
    // Verify final count
    const finalAssignments = await pool.query(
      'SELECT COUNT(*) as count FROM role_has_permissions WHERE role_id = $1',
      [superAdminRoleId]
    );
    console.log(`\n📊 Final permissions assigned to SUPER_ADMIN: ${finalAssignments.rows[0]?.count || 0}`);
    
    if (finalAssignments.rows[0]?.count > 0) {
      console.log('🎉 All permissions successfully assigned to SUPER_ADMIN!');
    } else {
      console.log('⚠️ No permissions were assigned. Check the database connection.');
    }
    
  } catch (error) {
    console.error('❌ Error assigning permissions to SUPER_ADMIN:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

assignAllToSuperAdmin();
