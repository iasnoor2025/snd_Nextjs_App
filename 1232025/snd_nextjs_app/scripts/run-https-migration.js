#!/usr/bin/env node

/**
 * Database HTTPS Migration Runner
 * 
 * This script connects to your database and runs the HTTPS migration
 * to replace all HTTP URLs with HTTPS URLs
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'snd_rental_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

console.log('🔧 Database HTTPS Migration Script');
console.log('==================================\n');

console.log('📋 Database Configuration:');
console.log(`Host: ${dbConfig.host}`);
console.log(`Port: ${dbConfig.port}`);
console.log(`Database: ${dbConfig.database}`);
console.log(`User: ${dbConfig.user}`);
console.log(`SSL: ${dbConfig.ssl ? 'Enabled' : 'Disabled'}\n`);

async function runMigration() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔌 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected to database successfully\n');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'comprehensive-https-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Running HTTPS migration...');
    console.log('This will update all HTTP URLs to HTTPS in the following tables:');
    console.log('- employee_documents');
    console.log('- equipment_documents');
    console.log('- media');
    console.log('- Any other tables with file URLs\n');

    // Execute the migration
    const result = await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!\n');
    
    // Show results
    console.log('📊 Migration Results:');
    if (result.rows && result.rows.length > 0) {
      result.rows.forEach(row => {
        console.log(`Table: ${row.table_name}`);
        console.log(`  Total Records: ${row.total_records}`);
        console.log(`  HTTPS MinIO Records: ${row.https_minio_records}`);
        console.log(`  HTTP MinIO Records: ${row.http_minio_records}`);
        console.log(`  HTTPS Supabase Records: ${row.https_supabase_records}`);
        console.log(`  HTTP Supabase Records: ${row.http_supabase_records}`);
        console.log('');
      });
    }

    // Check for any remaining HTTP URLs
    console.log('🔍 Checking for remaining HTTP URLs...');
    const httpCheckQuery = `
      SELECT 'employee_documents' as table_name, COUNT(*) as http_count
      FROM employee_documents 
      WHERE file_path LIKE 'http://%'
      
      UNION ALL
      
      SELECT 'equipment_documents' as table_name, COUNT(*) as http_count
      FROM equipment_documents 
      WHERE file_path LIKE 'http://%'
      
      UNION ALL
      
      SELECT 'media' as table_name, COUNT(*) as http_count
      FROM media 
      WHERE file_path LIKE 'http://%';
    `;
    
    const httpCheckResult = await client.query(httpCheckQuery);
    
    let totalHttpUrls = 0;
    httpCheckResult.rows.forEach(row => {
      totalHttpUrls += parseInt(row.http_count);
      if (parseInt(row.http_count) > 0) {
        console.log(`⚠️  ${row.table_name}: ${row.http_count} HTTP URLs remaining`);
      }
    });
    
    if (totalHttpUrls === 0) {
      console.log('✅ No HTTP URLs remaining - Migration successful!');
    } else {
      console.log(`⚠️  Total HTTP URLs remaining: ${totalHttpUrls}`);
    }

    client.release();
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});