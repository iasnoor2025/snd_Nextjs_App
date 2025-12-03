const { Pool } = require('pg');
require('dotenv').config();

async function checkTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Checking database tables...\n');

    // Check all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('All tables:');
    tablesResult.rows.forEach(row => console.log(`  - ${row.table_name}`));

    // Check role-related tables
    const roleTablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%role%'
      ORDER BY table_name
    `);

    console.log('\nRole-related tables:');
    roleTablesResult.rows.forEach(row => console.log(`  - ${row.table_name}`));

    // Check permission-related tables
    const permissionTablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%permission%'
      ORDER BY table_name
    `);

    console.log('\nPermission-related tables:');
    permissionTablesResult.rows.forEach(row => console.log(`  - ${row.table_name}`));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkTables();
