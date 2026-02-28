#!/usr/bin/env node
/**
 * Run petty cash migration (0035) directly.
 * Use when drizzle:migrate fails due to journal sync issues.
 */
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const sqlPath = path.join(__dirname, '../drizzle/migrations/0035_add_petty_cash.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    console.log('🚀 Running petty cash migration...');
    await pool.query(sql);
    console.log('✅ Petty cash migration completed successfully!');
  } catch (err) {
    if (err.code === '42P07' && err.message?.includes('already exists')) {
      console.log('ℹ️  Petty cash tables already exist. Skipping.');
    } else {
      console.error('❌ Migration failed:', err.message);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

run();
