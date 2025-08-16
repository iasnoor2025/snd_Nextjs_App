const fs = require('fs');
const path = require('path');

// Function to recursively find all .ts files
function findTsFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findTsFiles(fullPath, files);
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to fix ALL parameter issues in a file
function fixAllParameterIssues(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Find all function declarations and fix parameter mismatches
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for function declarations with NextRequest parameters
      if (line.includes('async (') && line.includes(': NextRequest')) {
        const paramMatch = line.match(/async\s*\(([^:]+):\s*NextRequest/);
        if (paramMatch) {
          const paramName = paramMatch[1].trim();
          
          // Find the function body boundaries
          let braceCount = 0;
          let functionStart = -1;
          let functionEnd = -1;
          
          // Look for opening brace
          for (let j = i; j < lines.length; j++) {
            if (lines[j].includes('{')) {
              functionStart = j;
              break;
            }
          }
          
          if (functionStart !== -1) {
            // Count braces to find function end
            for (let j = functionStart; j < lines.length; j++) {
              if (lines[j].includes('{')) braceCount++;
              if (lines[j].includes('}')) braceCount--;
              if (braceCount === 0) {
                functionEnd = j;
                break;
              }
            }
            
            // Fix all parameter references within the function
            if (functionEnd !== -1) {
              for (let j = functionStart; j <= functionEnd; j++) {
                if (paramName === 'request') {
                  // Parameter is 'request', fix _request references
                  if (lines[j].includes('_request.url')) {
                    lines[j] = lines[j].replace(/_request\.url/g, 'request.url');
                    modified = true;
                  }
                  if (lines[j].includes('_request.json()')) {
                    lines[j] = lines[j].replace(/_request\.json\(\)/g, 'request.json()');
                    modified = true;
                  }
                } else if (paramName === '_request') {
                  // Parameter is '_request', fix request references
                  if (lines[j].includes('request.url')) {
                    lines[j] = lines[j].replace(/request\.url/g, '_request.url');
                    modified = true;
                  }
                  if (lines[j].includes('request.json()')) {
                    lines[j] = lines[j].replace(/request\.json\(\)/g, '_request.json()');
                    modified = true;
                  }
                }
              }
            }
          }
        }
      }
    }
    
    if (modified) {
      content = lines.join('\n');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed parameter issues in: ${filePath}`);
    }
    
    return modified;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
console.log('🚀 Starting comprehensive parameter fix for entire codebase...');
const projectRoot = process.cwd();
const tsFiles = findTsFiles(projectRoot);

console.log(`📁 Found ${tsFiles.length} TypeScript files to scan`);

let fixedCount = 0;
for (const file of tsFiles) {
  if (fixAllParameterIssues(file)) {
    fixedCount++;
  }
}

console.log(`\n🎉 COMPLETE! Fixed ${fixedCount} files`);
console.log('🚀 All parameter naming issues should now be resolved!');
console.log('💡 Run npm run build to verify all errors are fixed');
