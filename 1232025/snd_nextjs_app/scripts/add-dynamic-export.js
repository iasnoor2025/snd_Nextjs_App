const fs = require('fs');
const path = require('path');

// Function to recursively find all .tsx files
function findTsxFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      findTsxFiles(fullPath, files);
    } else if (item.endsWith('.tsx') && item === 'page.tsx') {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to check if a file uses useI18n
function usesUseI18n(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes('useI18n') || content.includes('ProtectedRoute');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return false;
  }
}

// Function to add dynamic export to a file
function addDynamicExport(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if dynamic export already exists
    if (content.includes('export const dynamic = \'force-dynamic\'')) {
      return false;
    }
    
    // Split content into lines
    const lines = content.split('\n');
    const newLines = [];
    let added = false;
    
    for (const line of lines) {
      newLines.push(line);
      
      // Add dynamic export after 'use client' directive
      if (line.trim() === "'use client';" && !added) {
        newLines.push('');
        newLines.push('// Force dynamic rendering to prevent SSR issues');
        newLines.push("export const dynamic = 'force-dynamic';");
        newLines.push('');
        added = true;
      }
    }
    
    // If no 'use client' found, add at the beginning
    if (!added) {
      newLines.unshift("export const dynamic = 'force-dynamic';");
      newLines.unshift('');
      newLines.unshift('// Force dynamic rendering to prevent SSR issues');
    }
    
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error modifying file ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
const srcDir = path.join(__dirname, '..', 'src', 'app');
const tsxFiles = findTsxFiles(srcDir);
let modifiedCount = 0;
let totalCount = 0;

console.log('Scanning for pages that use useI18n or ProtectedRoute...\n');

for (const file of tsxFiles) {
  if (usesUseI18n(file)) {
    totalCount++;
    const relativePath = path.relative(path.join(__dirname, '..'), file);
    console.log(`Found: ${relativePath}`);
    
    if (addDynamicExport(file)) {
      modifiedCount++;
      console.log(`  ✓ Added dynamic export`);
    } else {
      console.log(`  - Already has dynamic export`);
    }
  }
}

console.log(`\nSummary:\n- Total pages with useI18n or ProtectedRoute: ${totalCount}\n- Pages modified: ${modifiedCount}\n- Pages already had dynamic export: ${totalCount - modifiedCount}`);
