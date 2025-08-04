#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment variables...\n');

// Check if .env.local already exists
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env.local already exists. Please check if DATABASE_URL is set correctly.');
  console.log('📁 Current .env.local location:', envPath);
  return;
}

// Create .env.local template
const envTemplate = `# Database Configuration (REQUIRED)
# Replace with your actual PostgreSQL connection string
DATABASE_URL="postgresql://username:password@localhost:5432/snd_nextjs_db"

# Next.js Configuration
NEXT_PUBLIC_API_URL="/api"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-here"

# Development
NODE_ENV="development"

# Optional: ERPNext Integration (if using)
# NEXT_PUBLIC_ERPNEXT_URL="https://your-erpnext-instance.com"
# ERPNEXT_API_KEY="your_api_key_here"
# ERPNEXT_API_SECRET="your_api_secret_here"

# Optional: Laravel Backend (if using)
# NEXT_PUBLIC_LARAVEL_URL="http://localhost:8000"

# Optional: File Upload (if using S3/MinIO)
# AWS_ACCESS_KEY_ID="your_access_key"
# AWS_SECRET_ACCESS_KEY="your_secret_key"
# AWS_REGION="us-east-1"
# AWS_S3_BUCKET="your-bucket-name"
# AWS_S3_ENDPOINT="https://your-s3-endpoint.com"
`;

try {
  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Created .env.local file');
  console.log('📁 Location:', envPath);
  console.log('\n📝 Next steps:');
  console.log('1. Edit .env.local and set your DATABASE_URL');
  console.log('2. Make sure PostgreSQL is running');
  console.log('3. Run: npx prisma migrate dev');
  console.log('4. Run: npm run dev');
  console.log('\n❓ Need help? Check DATABASE_SETUP_QUICK.md');
} catch (error) {
  console.error('❌ Failed to create .env.local:', error.message);
  console.log('\n📝 Manual setup:');
  console.log('1. Create .env.local file in the project root');
  console.log('2. Add the DATABASE_URL variable');
  console.log('3. Follow the setup guide in DATABASE_SETUP_QUICK.md');
} 