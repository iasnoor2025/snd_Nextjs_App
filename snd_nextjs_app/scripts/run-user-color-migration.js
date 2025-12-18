const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { config: dotenvConfig } = require('dotenv');

dotenvConfig({ path: '.env.local' });
dotenvConfig({ path: '.env' });

console.log('🚀 Running User Preferred Color Migration...');

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
    console.log('\n🔌 Connected to database');
    console.log('📄 Running migration: Add preferred_color column to users table...\n');

    const migrationPath = path.join(__dirname, '..', 'drizzle', 'migrations', '0034_add_user_preferred_color.sql');

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    await client.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('📊 Added preferred_color column to users table');
    console.log('   - Users can now set their preferred UI color');
    console.log('   - This color will override the role color\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === '42701') { // column "preferred_color" already exists
      console.log('ℹ️  Column "preferred_color" already exists. Migration may have already been run.');
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

