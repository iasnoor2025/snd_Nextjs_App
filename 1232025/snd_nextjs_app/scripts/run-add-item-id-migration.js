const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Environment variables loaded...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('');

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
    console.log('📄 Running migration: Add rental_item_id to rental_timesheet_received table...\n');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'drizzle', '0039_add_rental_item_id_to_timesheet_received.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Updated table: rental_timesheet_received');
    console.log('   - Added rental_item_id column');
    console.log('   - Updated unique constraint to include rental_item_id');
    console.log('   - Added foreign key to rental_items table\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === '42703') {
      console.log('ℹ️  Column may already exist or table structure issue.');
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

