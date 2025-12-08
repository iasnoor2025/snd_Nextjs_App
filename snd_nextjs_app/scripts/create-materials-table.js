const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function createMaterialsTable() {
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
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Check if table already exists
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'materials'
      );
    `);

    if (checkResult.rows[0].exists) {
      console.log('ℹ️  Materials table already exists, skipping creation...');
      await client.end();
      process.exit(0);
    }

    // Create the materials table
    console.log('📝 Creating materials table...');
    await client.query(`
      CREATE TABLE "materials" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "description" text,
        "category" text,
        "unit" text,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" date DEFAULT CURRENT_DATE NOT NULL,
        "updated_at" date NOT NULL
      );
    `);

    // Create the unique index
    console.log('📝 Creating unique index on materials.name...');
    await client.query(`
      CREATE UNIQUE INDEX "materials_name_key" 
      ON "materials" USING btree ("name" text_ops);
    `);

    console.log('✅ Materials table created successfully!');
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating materials table:', error.message);
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Materials table already exists, skipping...');
      await client.end();
      process.exit(0);
    } else {
      await client.end();
      process.exit(1);
    }
  }
}

createMaterialsTable();

