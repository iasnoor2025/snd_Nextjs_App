const { execSync } = require('child_process');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Environment variables loaded for schema push...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('');

try {
  console.log('🚀 Pushing Drizzle schema to database...');
  execSync('npx drizzle-kit push', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('✅ Schema pushed successfully!');
} catch (error) {
  console.error('❌ Schema push failed:', error.message);
  process.exit(1);
}
