#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 1,
});

async function removeLegacyTables() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Removing legacy tables...');
    
    // List of legacy tables to remove
    const legacyTables = [
      '_prisma_migrations'
    ];
    
    for (const tableName of legacyTables) {
      try {
        await client.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
        console.log(`✅ Removed legacy table: ${tableName}`);
      } catch (error) {
        console.log(`⚠️ Warning removing ${tableName}:`, error.message);
      }
    }
    
    console.log('✅ Legacy table cleanup completed!');
    
  } catch (error) {
    console.error('❌ Legacy table cleanup failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

removeLegacyTables()
  .then(() => {
    console.log('\n🎉 Legacy table cleanup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Legacy table cleanup failed:', error);
    process.exit(1);
  });
