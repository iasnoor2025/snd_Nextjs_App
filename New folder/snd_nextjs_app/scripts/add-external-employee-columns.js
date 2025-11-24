const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function addColumns() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Connecting to database...');
    const client = await pool.connect();
    
    // Check if columns already exist
    const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'employees' 
        AND column_name IN ('is_external', 'company_name')
    `);
    
    const existingColumns = checkColumns.rows.map(row => row.column_name);
    console.log('📋 Existing columns:', existingColumns);
    
    // Add is_external column if it doesn't exist
    if (!existingColumns.includes('is_external')) {
      console.log('➕ Adding is_external column...');
      await client.query(`
        ALTER TABLE employees 
        ADD COLUMN is_external BOOLEAN DEFAULT false NOT NULL
      `);
      console.log('✅ Added is_external column');
    } else {
      console.log('✓ is_external column already exists');
    }
    
    // Add company_name column if it doesn't exist
    if (!existingColumns.includes('company_name')) {
      console.log('➕ Adding company_name column...');
      await client.query(`
        ALTER TABLE employees 
        ADD COLUMN company_name TEXT
      `);
      console.log('✅ Added company_name column');
    } else {
      console.log('✓ company_name column already exists');
    }
    
    client.release();
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addColumns();

