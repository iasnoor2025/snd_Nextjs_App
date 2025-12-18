const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

console.log('🚀 Running Role Color Migration...\n');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔌 Connected to database');
    console.log('📄 Running migration: Add color column to roles table...\n');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'drizzle', 'migrations', '0033_add_role_color.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Added color column to roles table');
    console.log('   - Set default colors for existing roles');
    console.log('   - SUPER_ADMIN: red');
    console.log('   - ADMIN: blue');
    console.log('   - MANAGER: purple');
    console.log('   - SUPERVISOR: orange');
    console.log('   - OPERATOR: green');
    console.log('   - EMPLOYEE: gray');
    console.log('   - USER: slate\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === '42701') {
      console.log('ℹ️  Column already exists. Migration may have already been run.');
    } else {
      throw error;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

