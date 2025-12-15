#!/usr/bin/env tsx

/**
 * Migration script to add priority column to projects table
 */

import 'dotenv/config';
import { getPool } from '../src/lib/drizzle';

async function runMigration() {
  const pool = getPool();
  
  try {
    console.log('🚀 Running migration: Adding priority column to projects table...');
    
    // Execute the migration SQL
    await pool.query(`
      ALTER TABLE "projects" 
      ADD COLUMN IF NOT EXISTS "priority" text DEFAULT 'medium' NOT NULL;
    `);
    
    console.log('✅ Migration completed successfully!');
    console.log('   Added "priority" column to projects table with default value "medium"');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error instanceof Error ? error.message : String(error));
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
