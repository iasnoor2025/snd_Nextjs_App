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
    console.log('📄 Running migration: Add rental_equipment_timesheets table...\n');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'drizzle', '0040_add_rental_equipment_timesheets.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Created table: rental_equipment_timesheets');
    console.log('   - Tracks equipment usage hours (regular + overtime) per day');
    console.log('   - Linked to rental_items, rentals, and equipment tables');
    console.log('   - Unique constraint on (rental_item_id, date)');
    console.log('   - Used for accurate hourly billing in invoices\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === '42P07') {
      console.log('ℹ️  Table already exists. Migration may have already been run.');
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

