#!/usr/bin/env node

/**
 * Simple HTTPS Migration Runner
 * Loads environment variables and runs the migration
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔧 HTTPS URL Migration Script');
console.log('=============================\n');

console.log('📋 Environment Check:');
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
console.log(`DB_HOST: ${process.env.DB_HOST || 'Not set'}`);
console.log(`DB_NAME: ${process.env.DB_NAME || 'Not set'}`);
console.log(`DB_USER: ${process.env.DB_USER || 'Not set'}\n`);

if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
  console.error('❌ No database configuration found!');
  console.error('Please ensure DATABASE_URL or DB_HOST is set in .env.local');
  process.exit(1);
}

// Import and run the migration
const { execSync } = require('child_process');

try {
  console.log('🚀 Running HTTPS migration...');
  execSync('npx tsx scripts/migrate-https-urls.ts', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('✅ Migration completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}