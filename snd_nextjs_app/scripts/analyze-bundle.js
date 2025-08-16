#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Starting bundle analysis...\n');

try {
  // Check if .next directory exists
  if (!fs.existsSync(path.join(process.cwd(), '.next'))) {
    console.log('⚠️  .next directory not found. Building project first...\n');
    execSync('npm run build', { stdio: 'inherit' });
  }

  // Run bundle analyzer
  console.log('📊 Running bundle analyzer...\n');
  execSync('cross-env ANALYZE=true npm run build', { stdio: 'inherit' });

  console.log('\n✅ Bundle analysis complete!');
  console.log('📁 Check the generated bundle-analysis.html file in your project root');
  console.log('🌐 Open it in your browser to view the detailed bundle breakdown');
  
} catch (error) {
  console.error('\n❌ Bundle analysis failed:', error.message);
  process.exit(1);
}
