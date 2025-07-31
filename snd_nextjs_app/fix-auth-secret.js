const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');

try {
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Replace the placeholder NEXTAUTH_SECRET with a proper secret
  envContent = envContent.replace(
    'NEXTAUTH_SECRET=your-secret-key-here-change-in-production',
    'NEXTAUTH_SECRET=my-super-secret-key-for-development-only-change-in-production'
  );
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Fixed NEXTAUTH_SECRET in .env.local');
  console.log('🔑 New secret: my-super-secret-key-for-development-only-change-in-production');
} catch (error) {
  console.error('❌ Error fixing NEXTAUTH_SECRET:', error);
} 