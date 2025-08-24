import { config } from 'dotenv';
import { resolve } from 'path';
import { pool } from '../lib/drizzle';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../../.env.local') });

async function debugUserRole() {
  try {
    console.log('🔍 Debugging user role and permissions...\n');
    
    // Check users table
    const usersResult = await pool.query('SELECT id, email, name, role_id FROM users LIMIT 10');
    console.log('📋 Users in database:');
    usersResult.rows.forEach((user: any) => {
      console.log(`  - ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Role ID: ${user.role_id}`);
    });
    
    // Check user_roles table
    const userRolesResult = await pool.query(`
      SELECT u.email, u.name, r.name as role_name, r.id as role_id
      FROM users u
      LEFT JOIN user_has_roles uhr ON u.id = uhr.user_id
      LEFT JOIN roles r ON uhr.role_id = r.id
      ORDER BY u.email
    `);
    
    console.log('\n📋 User roles mapping:');
    userRolesResult.rows.forEach((userRole: any) => {
      console.log(`  - Email: ${userRole.email}, Name: ${userRole.name}, Role: ${userRole.role_name || 'None'} (ID: ${userRole.role_id || 'None'})`);
    });
    
    // Check roles table
    const rolesResult = await pool.query('SELECT id, name, guard_name FROM roles ORDER BY id');
    console.log('\n📋 Available roles:');
    rolesResult.rows.forEach((role: any) => {
      console.log(`  - ID: ${role.id}, Name: ${role.name}, Guard: ${role.guard_name}`);
    });
    
    // Check permissions count
    const permissionsResult = await pool.query('SELECT COUNT(*) as count FROM permissions');
    console.log(`\n📊 Total permissions in database: ${permissionsResult.rows[0]?.count || 0}`);
    
  } catch (error) {
    console.error('❌ Error debugging user role:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

debugUserRole();
