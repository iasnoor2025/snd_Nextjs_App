const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkDatabase() {
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

    // Check what tables exist
    console.log('\n📋 Checking existing tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`Found ${tablesResult.rows.length} tables:`);
    if (tablesResult.rows.length === 0) {
      console.log('❌ No tables found in database!');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    }

    // Check sequences
    console.log('\n🔢 Checking sequences...');
    const sequencesResult = await client.query(`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public'
      ORDER BY sequence_name
    `);
    
    console.log(`Found ${sequencesResult.rows.length} sequences:`);
    if (sequencesResult.rows.length === 0) {
      console.log('❌ No sequences found in database!');
    } else {
      sequencesResult.rows.forEach(row => {
        console.log(`  - ${row.sequence_name}`);
      });
    }

  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the check
checkDatabase();
