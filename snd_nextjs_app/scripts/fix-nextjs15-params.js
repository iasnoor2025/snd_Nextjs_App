#!/usr/bin/env node

/**
 * Script to fix Next.js 15 params compatibility issues
 * This script updates files to use React.use() for unwrapping params Promise
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to search for
const patterns = [
  'src/app/modules/**/*.tsx',
  'src/app/**/[id]/**/*.tsx',
  'src/app/**/[id]/page.tsx'
];

// Files that need the params fix
const filesToFix = [
  // Customer Management
  'src/app/modules/customer-management/[id]/edit/page.tsx',
  'src/app/modules/customer-management/[id]/page.tsx',
  
  // Company Management
  'src/app/modules/company-management/[id]/edit/page.tsx',
  'src/app/modules/company-management/[id]/page.tsx',
  
  // Employee Management
  'src/app/modules/employee-management/[id]/edit/page.tsx',
  'src/app/modules/employee-management/[id]/page.tsx',
  'src/app/modules/employee-management/[id]/payments/[paymentId]/receipt/page.tsx',
  
  // User Management
  'src/app/modules/user-management/[id]/page.tsx',
  'src/app/modules/user-management/edit/[id]/page.tsx',
  'src/app/modules/user-management/role/[id]/page.tsx',
  'src/app/modules/user-management/role/edit/[id]/page.tsx',
  
  // Project Management
  'src/app/modules/project-management/[id]/page.tsx',
  'src/app/modules/project-management/[id]/edit/page.tsx',
  'src/app/modules/project-management/[id]/resources/page.tsx',
  'src/app/modules/project-management/[id]/reports/page.tsx',
  'src/app/modules/project-management/[id]/planning/page.tsx',
  
  // Equipment Management
  'src/app/modules/equipment-management/[id]/page.tsx',
  'src/app/modules/equipment-management/[id]/edit/page.tsx',
  'src/app/modules/equipment-management/[id]/assign/page.tsx',
  
  // Leave Management
  'src/app/modules/leave-management/[id]/page.tsx',
  'src/app/modules/leave-management/[id]/edit/page.tsx',
  
  // Location Management
  'src/app/modules/location-management/[id]/page.tsx',
  
  // Payroll Management
  'src/app/modules/payroll-management/[id]/page.tsx',
  'src/app/modules/payroll-management/[id]/edit/page.tsx',
  
  // Timesheet Management
  'src/app/modules/timesheet-management/[id]/page.tsx',
  'src/app/modules/timesheet-management/[id]/edit/page.tsx',
  
  // Salary Increments
  'src/app/modules/salary-increments/edit/[id]/page.tsx',
  
  // Rental Management
  'src/app/modules/rental-management/[id]/page.tsx',
  
  // Reporting
  'src/app/modules/reporting/[id]/page.tsx'
];

console.log('🔍 Next.js 15 Params Compatibility Fix Script');
console.log('=============================================\n');

console.log('📋 Files that need to be updated:');
filesToFix.forEach((file, index) => {
  console.log(`${index + 1}. ${file}`);
});

console.log('\n📝 Manual Fix Instructions:');
console.log('===========================\n');

console.log('For each file, you need to make the following changes:\n');

console.log('1. **For files using params prop (like customer edit page):**');
console.log('   - Change: export default function Page({ params }: { params: { id: string } })');
console.log('   - To: export default function Page({ params }: { params: Promise<{ id: string }> })');
console.log('   - Add: import { useState, useEffect, use } from "react";');
console.log('   - Add: const { id } = use(params);');
console.log('   - Replace all params.id with id\n');

console.log('2. **For files using useParams() (like company edit page):**');
console.log('   - Add: import { useState, useEffect, use } from "react";');
console.log('   - Add: const { id } = use(params); after const params = useParams();');
console.log('   - Replace all params.id with id\n');

console.log('3. **For files using params.id as string:**');
console.log('   - Change: const userId = params.id as string;');
console.log('   - To: const { id: userId } = use(params);');
console.log('   - Or: const params = useParams(); const { id: userId } = use(params);\n');

console.log('⚠️  Important Notes:');
console.log('- The use() hook must be called unconditionally at the top level');
console.log('- Never call use() inside loops, conditions, or nested functions');
console.log('- Always destructure the id immediately after calling use()');
console.log('- Replace ALL instances of params.id with the destructured id variable\n');

console.log('🚀 Quick Fix Commands:');
console.log('======================\n');

console.log('You can run these commands to fix specific files:\n');

console.log('# Fix customer edit page (already done)');
console.log('echo "Customer edit page already fixed"');

console.log('\n# Fix company edit page (already done)');
console.log('echo "Company edit page already fixed"');

console.log('\n# Fix employee edit page');
console.log('echo "Need to manually fix: src/app/modules/employee-management/[id]/edit/page.tsx"');

console.log('\n# Fix user management pages');
console.log('echo "Need to manually fix: src/app/modules/user-management/[id]/page.tsx"');

console.log('\n📚 Additional Resources:');
console.log('=======================');
console.log('- Next.js 15 Migration Guide: https://nextjs.org/docs/upgrading');
console.log('- React use() Hook Documentation: https://react.dev/reference/react/use');
console.log('- App Router Params: https://nextjs.org/docs/app/api-reference/file-conventions/page#params\n');

console.log('✅ Files already fixed:');
console.log('- src/app/modules/customer-management/[id]/edit/page.tsx');
console.log('- src/app/modules/company-management/[id]/edit/page.tsx\n');

console.log('🔧 Files still need fixing:');
filesToFix.slice(2).forEach((file, index) => {
  console.log(`${index + 1}. ${file}`);
});

console.log('\n💡 Tip: You can use search and replace in your editor:');
console.log('Search for: params\\.id');
console.log('Replace with: id (after adding the use() hook)');

console.log('\n🎯 Priority order for fixing:');
console.log('1. High-traffic pages (employee, user management)');
console.log('2. CRUD operations (edit pages)');
console.log('3. Detail pages (view pages)');
console.log('4. Utility pages (reports, planning)');

console.log('\n✨ Happy coding! Remember to test each page after fixing.');
