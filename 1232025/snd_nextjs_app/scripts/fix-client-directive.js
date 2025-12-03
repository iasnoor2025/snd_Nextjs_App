const fs = require('fs');
const path = require('path');

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

function fixClientDirective(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Check if the file has the wrong order
    const hasDynamicExportFirst = lines[0].trim() === "export const dynamic = 'force-dynamic';";
    const hasUseClientLater = lines.some((line, index) => index > 0 && line.trim() === "'use client';");
    
    if (hasDynamicExportFirst && hasUseClientLater) {
      // Find the 'use client' line
      const useClientIndex = lines.findIndex(line => line.trim() === "'use client';");
      
      // Remove the dynamic export from the beginning
      lines.splice(0, 1);
      
      // Insert dynamic export after 'use client'
      lines.splice(useClientIndex + 1, 0, '', '// Force dynamic rendering to prevent SSR issues', "export const dynamic = 'force-dynamic';", '');
      
      fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error fixing file ${filePath}:`, error.message);
    return false;
  }
}

const srcDir = path.join(__dirname, '..', 'src', 'app');
const tsxFiles = findTsxFiles(srcDir);
let fixedCount = 0;

console.log('Fixing client directive order...\n');

for (const file of tsxFiles) {
  const relativePath = path.relative(path.join(__dirname, '..'), file);
  
  if (fixClientDirective(file)) {
    fixedCount++;
    console.log(`✓ Fixed: ${relativePath}`);
  }
}

console.log(`\nSummary:\n- Files fixed: ${fixedCount}`);
