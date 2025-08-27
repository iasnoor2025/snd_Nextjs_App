const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function resetDatabase() {
  console.log('🔍 Environment variables loaded:');
  console.log('DB_HOST:', process.env.DB_HOST || 'localhost (default)');
  console.log('DB_PORT:', process.env.DB_PORT || '5432 (default)');
  console.log('DB_NAME:', process.env.DB_NAME || 'postgres (default)');
  console.log('DB_USER:', process.env.DB_USER || 'postgres (default)');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  console.log('');
  
  let client;
  
  if (process.env.DATABASE_URL) {
    console.log('🔗 Using DATABASE_URL connection...');
    client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
  } else {
    console.log('🔗 Using individual database parameters...');
    client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    });
  }

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    console.log('🗑️  Reading reset script...');
    const fs = require('fs');
    const resetSQL = fs.readFileSync('./scripts/reset-database-production.sql', 'utf8');

    console.log('⚠️  WARNING: This will delete ALL data from the database!');
    console.log('📋 Executing database reset...');

    await client.query(resetSQL);
    
    console.log('✅ Database reset completed successfully!');
    console.log('🚀 Ready for production deployment');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the reset
resetDatabase();
