const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkUniqueConstraints() {
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

    console.log('\n🔒 Unique Constraints & Indexes Analysis\n');

    // Check all unique constraints
    const uniqueResult = await client.query(`
      SELECT 
        tc.table_name, 
        kcu.column_name,
        tc.constraint_name,
        tc.constraint_type
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
        AND tc.table_name IN ('users', 'roles', 'permissions', 'role_has_permissions', 'model_has_roles')
      ORDER BY tc.table_name, tc.constraint_type, kcu.column_name
    `);
    
    console.log('📋 Unique Constraints & Primary Keys:');
    uniqueResult.rows.forEach(constraint => {
      console.log(`   ${constraint.table_name}.${constraint.column_name} - ${constraint.constraint_type} (${constraint.constraint_name})`);
    });

    // Check indexes
    const indexesResult = await client.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename IN ('users', 'roles', 'permissions', 'role_has_permissions', 'model_has_roles')
        AND schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    console.log('\n📋 Database Indexes:');
    indexesResult.rows.forEach(index => {
      console.log(`   ${index.tablename}.${index.indexname}:`);
      console.log(`     ${index.indexdef}`);
    });

    // Check composite primary keys
    const compositeResult = await client.query(`
      SELECT 
        tc.table_name, 
        string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns,
        tc.constraint_name
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_name IN ('users', 'roles', 'permissions', 'role_has_permissions', 'model_has_roles')
      GROUP BY tc.table_name, tc.constraint_name
      ORDER BY tc.table_name
    `);
    
    console.log('\n📋 Composite Primary Keys:');
    compositeResult.rows.forEach(pk => {
      console.log(`   ${pk.table_name}: ${pk.columns} (${pk.constraint_name})`);
    });

  } catch (error) {
    console.error('❌ Unique constraints check failed:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

checkUniqueConstraints();
