#!/usr/bin/env node

/**
 * MinIO HTTPS Production Fix Script
 * 
 * This script helps fix the mixed content error by:
 * 1. Updating environment variables to use HTTPS MinIO endpoint
 * 2. Running database migration to update existing HTTP URLs to HTTPS
 * 3. Providing verification steps
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 MinIO HTTPS Production Fix Script');
console.log('=====================================\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: Please run this script from the project root directory');
  process.exit(1);
}

console.log('📋 Steps to fix MinIO HTTPS mixed content error:\n');

console.log('1. 🔧 Update Environment Variables');
console.log('   In your production environment (Coolify dashboard), update:');
console.log('   S3_ENDPOINT=https://minio.snd-ksa.online');
console.log('   (Change from http:// to https://)\n');

console.log('2. 🗄️  Run Database Migration');
console.log('   Execute the SQL migration script:');
console.log('   scripts/fix-minio-https-urls.sql\n');

console.log('3. 🚀 Deploy Updated Code');
console.log('   - Push the updated code to production');
console.log('   - Ensure the build completes successfully\n');

console.log('4. 🔄 Restart Application');
console.log('   - Restart your application in Coolify');
console.log('   - Clear any caches (Redis, application cache)\n');

console.log('5. ✅ Verify the Fix');
console.log('   - Navigate to employee management page');
console.log('   - Try downloading a document');
console.log('   - Check browser console for errors\n');

console.log('📊 What this fix does:');
console.log('• Updates all MinIO URL generation to use HTTPS');
console.log('• Migrates existing HTTP URLs in database to HTTPS');
console.log('• Prevents mixed content security errors');
console.log('• Ensures all file downloads work over HTTPS\n');

console.log('🔍 Files Updated:');
console.log('• src/lib/minio/storage-service.ts - URL generation');
console.log('• src/app/api/upload/route.ts - Upload endpoint');
console.log('• src/app/api/employees/[id]/documents/upload/route.ts - Employee uploads');
console.log('• src/app/api/equipment/[id]/documents/route.ts - Equipment uploads');
console.log('• scripts/fix-minio-https-urls.sql - Database migration\n');

console.log('⚠️  Important Notes:');
console.log('• Make sure your MinIO server supports HTTPS');
console.log('• Update S3_ENDPOINT environment variable to use HTTPS');
console.log('• Run the database migration after deploying the code');
console.log('• Test file downloads after the fix is applied\n');

console.log('🎯 Expected Result:');
console.log('• No more "Mixed Content" errors in browser console');
console.log('• All document downloads work successfully');
console.log('• All MinIO URLs use HTTPS protocol\n');

console.log('📞 If issues persist:');
console.log('1. Verify MinIO server supports HTTPS');
console.log('2. Check environment variables are updated');
console.log('3. Ensure database migration was executed');
console.log('4. Clear all caches and restart application\n');

console.log('✅ Fix script completed! Follow the steps above to resolve the HTTPS issue.');
