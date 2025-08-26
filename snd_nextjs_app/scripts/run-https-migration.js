const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    console.log('🔒 Running HTTPS migration...');
    
    // Read the migration SQL
    const fs = require('fs');
    const migrationSQL = fs.readFileSync('./drizzle/0015_fix_http_urls_to_https.sql', 'utf8');
    
    console.log('📝 Migration SQL:');
    console.log(migrationSQL);
    
    // Execute the migration
    const result = await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Result:', result);
    
    // Verify the changes
    console.log('🔍 Verifying changes...');
    
    // Check employee documents
    const employeeResult = await client.query(`
      SELECT COUNT(*) as total, 
             COUNT(CASE WHEN file_path LIKE 'http://%' THEN 1 END) as http_count,
             COUNT(CASE WHEN file_path LIKE 'https://%' THEN 1 END) as https_count
      FROM employee_documents
    `);
    
    console.log('👥 Employee documents:', employeeResult.rows[0]);
    
    // Check equipment documents
    const equipmentResult = await client.query(`
      SELECT COUNT(*) as total, 
             COUNT(CASE WHEN file_path LIKE 'http://%' THEN 1 END) as http_count,
             COUNT(CASE WHEN file_path LIKE 'https://%' THEN 1 END) as https_count
      FROM media
    `);
    
    console.log('🔧 Equipment documents:', equipmentResult.rows[0]);
    
    // Show some example URLs
    const sampleUrls = await client.query(`
      SELECT file_path FROM employee_documents 
      WHERE file_path LIKE 'https://%' 
      LIMIT 3
    `);
    
    console.log('📋 Sample HTTPS URLs:');
    sampleUrls.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.file_path}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

runMigration();
