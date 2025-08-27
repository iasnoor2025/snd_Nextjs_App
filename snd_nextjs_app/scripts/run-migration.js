const { execSync } = require('child_process');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Environment variables loaded for migration...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('');

try {
  console.log('🚀 Running Drizzle migration...');
  execSync('npx drizzle-kit migrate', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('✅ Migration completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
