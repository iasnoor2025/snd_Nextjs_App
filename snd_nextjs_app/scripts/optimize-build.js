#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Optimizing build environment...');

// Clean Next.js cache
console.log('🧹 Cleaning Next.js cache...');
try {
  if (fs.existsSync('.next')) {
    fs.rmSync('.next', { recursive: true, force: true });
    console.log('✅ .next directory cleaned');
  }
} catch (error) {
  console.log('⚠️  Could not clean .next directory:', error.message);
}

// Clean node_modules cache
console.log('🧹 Cleaning node_modules cache...');
try {
  if (fs.existsSync('node_modules/.cache')) {
    fs.rmSync('node_modules/.cache', { recursive: true, force: true });
    console.log('✅ node_modules cache cleaned');
  }
} catch (error) {
  console.log('⚠️  Could not clean node_modules cache:', error.message);
}

// Clean npm cache
console.log('🧹 Cleaning npm cache...');
try {
  execSync('npm cache clean --force', { stdio: 'inherit' });
  console.log('✅ npm cache cleaned');
} catch (error) {
  console.log('⚠️  Could not clean npm cache:', error.message);
}

// Set memory limit for Node.js
console.log('💾 Setting Node.js memory limit...');
process.env.NODE_OPTIONS = '--max-old-space-size=8192';

console.log('✅ Build environment optimized!');
console.log('📝 Memory limit set to 8GB');
console.log('🔧 Run "npm run build" to start building');
