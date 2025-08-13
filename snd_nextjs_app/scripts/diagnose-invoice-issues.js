#!/usr/bin/env node

/**
 * Diagnostic script for rental invoice generation issues
 * Run this script to identify common problems
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Rental Invoice Generation Diagnostic Tool\n');

// Check environment variables
console.log('1. Environment Variables Check:');
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('   ✅ .env.local file exists');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {
    'NEXT_PUBLIC_ERPNEXT_URL': envContent.includes('NEXT_PUBLIC_ERPNEXT_URL'),
    'ERPNEXT_API_KEY': envContent.includes('ERPNEXT_API_KEY'),
    'ERPNEXT_API_SECRET': envContent.includes('ERPNEXT_API_SECRET')
  };
  
  Object.entries(envVars).forEach(([key, exists]) => {
    console.log(`   ${exists ? '✅' : '❌'} ${key}: ${exists ? 'Set' : 'Missing'}`);
  });
} else {
  console.log('   ❌ .env.local file not found');
}

// Check package.json dependencies
console.log('\n2. Dependencies Check:');
const packagePath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredDeps = ['jsPDF', 'drizzle-orm'];
  
  requiredDeps.forEach(dep => {
    const exists = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
    console.log(`   ${exists ? '✅' : '❌'} ${dep}: ${exists ? 'Installed' : 'Missing'}`);
  });
}

// Check file structure
console.log('\n3. File Structure Check:');
const requiredFiles = [
  'src/app/api/rentals/[id]/invoice/route.ts',
  'src/lib/services/erpnext-invoice-service.ts',
  'src/lib/pdf-generator.ts'
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(`   ${exists ? '✅' : '❌'} ${file}: ${exists ? 'Exists' : 'Missing'}`);
});

// Recommendations
console.log('\n4. Recommendations:');
console.log('   📋 If environment variables are missing:');
console.log('      - Create .env.local file with ERPNext credentials');
console.log('      - Restart your Next.js development server');
console.log('\n   🔗 Test ERPNext connection:');
console.log('      - Visit: http://localhost:3000/api/erpnext/test-invoice-connection');
console.log('\n   📖 Check detailed logs:');
console.log('      - Look for emoji indicators in browser console');
console.log('      - Check terminal/server logs for detailed error messages');
console.log('\n   🧪 Test with sample data:');
console.log('      - Ensure rental has valid customer and amount data');

console.log('\n🔧 For more help, check RENTAL_INVOICE_GENERATION.md');
