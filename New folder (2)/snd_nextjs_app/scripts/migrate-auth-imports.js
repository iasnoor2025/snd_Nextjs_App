/**
 * Script to migrate Auth.js v4 imports to v5 in all API routes
 * Run with: node scripts/migrate-auth-imports.js
 */

const fs = require('fs');
const path = require('path');

let filesUpdated = 0;
let filesSkipped = 0;

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Pattern 1: Replace getServerSession import from 'next-auth'
    if (content.includes("import { getServerSession } from 'next-auth'")) {
      content = content.replace(
        /import { getServerSession } from 'next-auth';/g,
        "import { getServerSession } from '@/lib/auth';"
      );
      modified = true;
      console.log(`  ✓ Updated getServerSession import`);
    }
    
    // Pattern 2: Replace getServerSession import from "next-auth" (double quotes)
    if (content.includes('import { getServerSession } from "next-auth"')) {
      content = content.replace(
        /import { getServerSession } from "next-auth";/g,
        "import { getServerSession } from '@/lib/auth';"
      );
      modified = true;
      console.log(`  ✓ Updated getServerSession import (double quotes)`);
    }
    
    // Pattern 3: Remove authOptions import
    if (content.includes("import { authOptions } from '@/lib/auth-config'")) {
      content = content.replace(
        /import { authOptions } from '@\/lib\/auth-config';\n?/g,
        ''
      );
      modified = true;
      console.log(`  ✓ Removed authOptions import`);
    }
    
    // Pattern 4: Remove authOptions import (double quotes)
    if (content.includes('import { authOptions } from "@/lib/auth-config"')) {
      content = content.replace(
        /import { authOptions } from "@\/lib\/auth-config";\n?/g,
        ''
      );
      modified = true;
      console.log(`  ✓ Removed authOptions import (double quotes)`);
    }
    
    // Pattern 5: Remove authConfig import if it's only used with getServerSession
    if (content.includes("import { authConfig } from '@/lib/auth-config'") && 
        !content.includes('NextAuth(authConfig)')) {
      content = content.replace(
        /import { authConfig } from '@\/lib\/auth-config';\n?/g,
        ''
      );
      modified = true;
      console.log(`  ✓ Removed authConfig import`);
    }
    
    // Pattern 6: Update getServerSession calls to remove authOptions/authConfig parameter
    if (content.includes('getServerSession(authOptions)')) {
      content = content.replace(
        /getServerSession\(authOptions\)/g,
        'getServerSession()'
      );
      modified = true;
      console.log(`  ✓ Updated getServerSession calls (removed authOptions)`);
    }
    
    if (content.includes('getServerSession(authConfig)')) {
      content = content.replace(
        /getServerSession\(authConfig\)/g,
        'getServerSession()'
      );
      modified = true;
      console.log(`  ✓ Updated getServerSession calls (removed authConfig)`);
    }
    
    // Clean up extra blank lines
    content = content.replace(/\n\n\n+/g, '\n\n');
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      filesUpdated++;
      return true;
    }
    
    filesSkipped++;
    return false;
    
  } catch (error) {
    console.error(`  ✗ Error updating file: ${error.message}`);
    return false;
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Only process files that import getServerSession
      if (content.includes('getServerSession')) {
        console.log(`\nProcessing: ${filePath}`);
        updateFile(filePath);
      }
    }
  });
}

console.log('🚀 Starting Auth.js v5 migration...\n');
console.log('This will update all API routes to use the new auth helper.\n');

// Start from the API directory
const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
const libDir = path.join(process.cwd(), 'src', 'lib');

if (fs.existsSync(apiDir)) {
  console.log('📁 Scanning API routes...');
  walkDirectory(apiDir);
}

if (fs.existsSync(libDir)) {
  console.log('\n📁 Scanning lib directory...');
  walkDirectory(libDir);
}

console.log('\n✨ Migration complete!');
console.log(`   Files updated: ${filesUpdated}`);
console.log(`   Files skipped: ${filesSkipped}`);
console.log('\n💡 Next steps:');
console.log('   1. Run: npm run type-check');
console.log('   2. Test authentication flow');
console.log('   3. Verify API routes work correctly\n');

