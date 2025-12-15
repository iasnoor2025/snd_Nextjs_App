#!/usr/bin/env tsx

/**
 * Script to verify that the priority column exists in the projects table
 */

import 'dotenv/config';
import { getPool } from '../src/lib/drizzle';

async function verifyColumn() {
  const pool = getPool();
  
  try {
    console.log('🔍 Checking if priority column exists in projects table...');
    
    // Check if the column exists
    const result = await pool.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'projects' AND column_name = 'priority';
    `);
    
    if (result.rows.length > 0) {
      const column = result.rows[0];
      console.log('✅ Priority column exists!');
      console.log(`   Type: ${column.data_type}`);
      console.log(`   Default: ${column.column_default}`);
      console.log(`   Nullable: ${column.is_nullable}`);
      
      // Check how many projects have priority set
      const countResult = await pool.query(`
        SELECT COUNT(*) as total, 
               COUNT(priority) as with_priority,
               COUNT(CASE WHEN priority IS NULL THEN 1 END) as null_priority
        FROM projects;
      `);
      
      const stats = countResult.rows[0];
      console.log(`\n📊 Project Statistics:`);
      console.log(`   Total projects: ${stats.total}`);
      console.log(`   With priority: ${stats.with_priority}`);
      console.log(`   Null priority: ${stats.null_priority}`);
    } else {
      console.log('❌ Priority column does NOT exist!');
      console.log('   Please run the migration: npx tsx scripts/add-priority-column.ts');
      process.exit(1);
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking column:', error instanceof Error ? error.message : String(error));
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

verifyColumn();
