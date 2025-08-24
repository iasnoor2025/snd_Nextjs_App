import { config } from 'dotenv';
import { resolve } from 'path';
import { pool } from '../lib/drizzle';
import { readFileSync } from 'fs';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../../.env.local') });

async function executePermissionsSQL() {
  try {
    console.log('🔧 Executing comprehensive permissions SQL script...\n');
    
    // Read the SQL file - use absolute path from project root
    const sqlFilePath = resolve(__dirname, '../../src/scripts/comprehensive-permissions.sql');
    console.log(`📁 Reading SQL file from: ${sqlFilePath}`);
    
    const sqlContent = readFileSync(sqlFilePath, 'utf-8');
    console.log(`📄 SQL file size: ${sqlContent.length} characters`);
    
    // Get initial count
    const initialResult = await pool.query('SELECT COUNT(*) as count FROM permissions');
    const initialCount = initialResult.rows[0]?.count || 0;
    console.log(`📊 Initial permissions count: ${initialCount}`);
    
    // Execute the entire SQL content as one statement
    try {
      console.log('🚀 Executing SQL script...');
      await pool.query(sqlContent);
      console.log('✅ SQL script executed successfully');
    } catch (error: unknown) {
      const dbError = error as { code?: string; message?: string };
      if (dbError.code === '42601') { // Syntax error - might be multiple statements
        console.log('⚠️  Multiple statements detected, trying alternative approach...');
        
        // Try executing statement by statement
        const statements = sqlContent
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📋 Found ${statements.length} statements to execute`);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i];
          if (!statement) continue;
          
          try {
            await pool.query(statement);
            successCount++;
            if (i % 20 === 0) {
              console.log(`  ✅ Executed ${i + 1}/${statements.length} statements`);
            }
          } catch (stmtError: unknown) {
            const stmtDbError = stmtError as { code?: string; message?: string };
            if (stmtDbError.code === '23505') { // Unique constraint violation
              successCount++;
            } else {
              console.error(`  ❌ Error in statement ${i + 1}:`, stmtDbError.message || 'Unknown error');
              errorCount++;
            }
          }
        }
        
        console.log(`  📊 Statement execution: ${successCount} success, ${errorCount} errors`);
      } else {
        console.error('❌ SQL execution failed:', dbError.message || 'Unknown error');
      }
    }
    
    // Get final count
    const finalResult = await pool.query('SELECT COUNT(*) as count FROM permissions');
    const finalCount = finalResult.rows[0]?.count || 0;
    
    console.log(`\n🎉 SQL execution completed!`);
    console.log(`  📊 Final permissions count: ${finalCount}`);
    console.log(`  📈 Permissions added: ${finalCount - initialCount}`);
    
  } catch (error) {
    console.error('❌ Error executing permissions SQL:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

executePermissionsSQL();
