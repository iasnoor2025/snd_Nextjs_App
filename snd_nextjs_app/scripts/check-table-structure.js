const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkTableStructure() {
  let client;
  
  if (process.env.DATABASE_URL) {
    client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
  } else {
    client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    });
  }

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check users table structure
    console.log('\n📋 Users table structure:');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });

    // Check roles table structure
    console.log('\n📋 Roles table structure:');
    const rolesResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'roles' 
      ORDER BY ordinal_position
    `);
    
    rolesResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });

    // Check designations table structure
    console.log('\n📋 Designations table structure:');
    const designationsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'designations' 
      ORDER BY ordinal_position
    `);
    
    designationsResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });

  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

checkTableStructure();
