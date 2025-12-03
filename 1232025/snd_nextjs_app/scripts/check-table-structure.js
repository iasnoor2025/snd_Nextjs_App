const { Pool } = require('pg');
require('dotenv').config();

async function checkTableStructure() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Checking table structure...\n');

    // Check model_has_roles table structure
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'model_has_roles'
      ORDER BY ordinal_position
    `);
    
    console.log('model_has_roles table columns:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });

    // Check a sample of data
    const sampleResult = await pool.query(`
      SELECT * FROM model_has_roles LIMIT 3
    `);
    
    console.log('\nSample data from model_has_roles:');
    sampleResult.rows.forEach(row => {
      console.log(`  - ${JSON.stringify(row)}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkTableStructure();
