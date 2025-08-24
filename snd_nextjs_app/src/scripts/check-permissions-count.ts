import { config } from 'dotenv';
import { resolve } from 'path';
import { pool } from '../lib/drizzle';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../../.env.local') });

async function checkPermissionsCount() {
  try {
    console.log('🔍 Checking permissions count...\n');
    
    // Check permissions count
    const permissionsResult = await pool.query('SELECT COUNT(*) as count FROM permissions');
    const totalPermissions = permissionsResult.rows[0]?.count || 0;
    console.log(`📊 Total permissions in database: ${totalPermissions}`);
    
    // Check a few sample permissions
    const samplePermissions = await pool.query('SELECT name, created_at FROM permissions ORDER BY id LIMIT 10');
    console.log('\n📋 Sample permissions:');
    samplePermissions.rows.forEach((perm: any) => {
      console.log(`  - ${perm.name} (created: ${perm.created_at})`);
    });
    
    // Check if there are any permissions with recent dates
    const recentPermissions = await pool.query(`
      SELECT COUNT(*) as count 
      FROM permissions 
      WHERE created_at >= '2025-08-24'
    `);
    const recentCount = recentPermissions.rows[0]?.count || 0;
    console.log(`\n📅 Permissions created on/after 2025-08-24: ${recentCount}`);
    
  } catch (error) {
    console.error('❌ Error checking permissions:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

checkPermissionsCount();
