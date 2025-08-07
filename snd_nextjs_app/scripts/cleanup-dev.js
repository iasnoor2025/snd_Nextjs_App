#!/usr/bin/env node

/**
 * Development Cleanup Script
 * Clears caches and resets development environment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');

console.log('🧹 Starting development cleanup...');

// Function to safely remove directory
function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    console.log(`Removing: ${dirPath}`);
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

// Function to safely remove file
function removeFile(filePath) {
  if (fs.existsSync(filePath)) {
    console.log(`Removing: ${filePath}`);
    fs.unlinkSync(filePath);
  }
}

try {
  // Clear Next.js cache
  console.log('📦 Clearing Next.js cache...');
  removeDirectory(path.join(projectRoot, '.next'));

  // Clear node_modules cache
  console.log('📦 Clearing node_modules cache...');
  removeDirectory(path.join(projectRoot, 'node_modules', '.cache'));

  // Clear TypeScript cache
  console.log('📦 Clearing TypeScript cache...');
  removeFile(path.join(projectRoot, 'tsconfig.tsbuildinfo'));

  // Clear Prisma cache
  console.log('📦 Clearing Prisma cache...');
  try {
    execSync('npx prisma generate --force', { 
      cwd: projectRoot, 
      stdio: 'inherit' 
    });
  } catch (error) {
    console.log('⚠️  Prisma generate failed, continuing...');
  }

  // Clear browser cache files
  console.log('🌐 Clearing browser cache files...');
  const cacheDirs = [
    path.join(projectRoot, '.cache'),
    path.join(projectRoot, 'cache'),
  ];
  
  cacheDirs.forEach(dir => removeDirectory(dir));

  // Clear temporary files
  console.log('🗑️  Clearing temporary files...');
  const tempFiles = [
    path.join(projectRoot, '*.tmp'),
    path.join(projectRoot, '*.log'),
  ];

  // Clear package manager caches
  console.log('📦 Clearing package manager caches...');
  try {
    execSync('npm cache clean --force', { 
      cwd: projectRoot, 
      stdio: 'inherit' 
    });
  } catch (error) {
    console.log('⚠️  npm cache clean failed, continuing...');
  }

  // Reinstall dependencies if needed
  console.log('📦 Reinstalling dependencies...');
  try {
    execSync('npm install', { 
      cwd: projectRoot, 
      stdio: 'inherit' 
    });
  } catch (error) {
    console.log('⚠️  npm install failed, continuing...');
  }

  console.log('✅ Development cleanup completed!');
  console.log('');
  console.log('🚀 You can now run: npm run dev');
  console.log('');

} catch (error) {
  console.error('❌ Cleanup failed:', error.message);
  process.exit(1);
}
