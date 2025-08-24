import { config } from 'dotenv';
import { resolve } from 'path';
import { pool } from '../lib/drizzle';
import { readFileSync } from 'fs';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../../.env.local') });

async function resetAndRecreatePermissions() {
  try {
    console.log('🧹 Resetting permissions table...\n');
    
    // First, check current state
    const initialCount = await pool.query('SELECT COUNT(*) as count FROM permissions');
    console.log(`📊 Initial permissions count: ${initialCount.rows[0]?.count || 0}`);
    
    // Clear role_has_permissions table first (due to foreign key constraints)
    console.log('🗑️ Clearing role_has_permissions table...');
    await pool.query('DELETE FROM role_has_permissions');
    console.log('✅ role_has_permissions cleared');
    
    // Clear permissions table
    console.log('🗑️ Clearing permissions table...');
    await pool.query('DELETE FROM permissions');
    console.log('✅ Permissions table cleared');
    
    // Reset the auto-increment counter
    console.log('🔄 Resetting permissions ID sequence...');
    await pool.query('ALTER SEQUENCE permissions_id_seq RESTART WITH 1');
    console.log('✅ ID sequence reset');
    
    // Verify table is empty
    const emptyCount = await pool.query('SELECT COUNT(*) as count FROM permissions');
    console.log(`📊 Permissions count after reset: ${emptyCount.rows[0]?.count || 0}`);
    
    console.log('\n🔧 Now recreating all permissions...\n');
    
    // Read the comprehensive permissions SQL file
    const sqlFilePath = resolve(__dirname, '../../src/scripts/comprehensive-permissions.sql');
    console.log(`📁 Reading SQL file from: ${sqlFilePath}`);
    
    const sqlContent = readFileSync(sqlFilePath, 'utf-8');
    console.log(`📄 SQL file size: ${sqlContent.length} characters`);
    
    // Split the SQL into individual statements - handle multi-line statements better
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .map(stmt => stmt.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim());
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;
      
      try {
        await pool.query(statement);
        successCount++;
        if (successCount % 50 === 0) {
          console.log(`  ✅ Processed ${successCount} statements...`);
        }
      } catch (error: unknown) {
        const dbError = error as { code?: string; message?: string };
        if (dbError.code === '23505') { // Unique constraint violation (permission already exists)
          console.log(`  ⚠️ Statement ${i + 1} skipped (already exists): ${statement.substring(0, 50)}...`);
        } else {
          console.error(`  ❌ Error executing statement ${i + 1}:`, dbError.message || 'Unknown error');
          errorCount++;
        }
      }
    }
    
    console.log(`\n📊 Execution Summary:`);
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    
    // Verify final count
    const finalCount = await pool.query('SELECT COUNT(*) as count FROM permissions');
    console.log(`\n📊 Final permissions count: ${finalCount.rows[0]?.count || 0}`);
    
    if (finalCount.rows[0]?.count > 0) {
      console.log('🎉 Permissions table successfully reset and recreated!');
    } else {
      console.log('⚠️ No permissions were created. Check the SQL file and database connection.');
    }
    
  } catch (error) {
    console.error('❌ Error in reset and recreate process:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

resetAndRecreatePermissions();
