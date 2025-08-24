import fs from 'fs';
import path from 'path';

// Define the permission configurations for each API route
const apiPermissions = {
  // Companies
  'src/app/api/companies/route.ts': {
    GET: 'PermissionConfigs.company.read',
    POST: 'PermissionConfigs.company.create',
    PUT: 'PermissionConfigs.company.update',
    DELETE: 'PermissionConfigs.company.delete'
  },
  
  // Company Documents
  'src/app/api/companies/[id]/documents/route.ts': {
    GET: 'PermissionConfigs.company.read',
    POST: 'PermissionConfigs.company.create'
  },
  
  'src/app/api/companies/[id]/documents/[documentId]/route.ts': {
    DELETE: 'PermissionConfigs.company.delete'
  },
  
  // Company Document Types
  'src/app/api/company-document-types/route.ts': {
    GET: 'PermissionConfigs.company.read',
    POST: 'PermissionConfigs.company.create'
  },
  
  'src/app/api/company-document-types/upload/route.ts': {
    POST: 'PermissionConfigs.company.create'
  },
  
  'src/app/api/company-document-types/files/route.ts': {
    GET: 'PermissionConfigs.company.read'
  },
  
  'src/app/api/company-document-types/files/[id]/route.ts': {
    DELETE: 'PermissionConfigs.company.delete'
  },
  
  // Departments
  'src/app/api/departments/route.ts': {
    GET: 'PermissionConfigs.department.read',
    POST: 'PermissionConfigs.department.create'
  },
  
  'src/app/api/departments/[id]/route.ts': {
    GET: 'PermissionConfigs.department.read',
    PUT: 'PermissionConfigs.department.update',
    DELETE: 'PermissionConfigs.department.delete'
  },
  
  // Designations
  'src/app/api/designations/route.ts': {
    GET: 'PermissionConfigs.designation.read',
    POST: 'PermissionConfigs.designation.create'
  },
  
  'src/app/api/designations/[id]/route.ts': {
    GET: 'PermissionConfigs.designation.read',
    PUT: 'PermissionConfigs.designation.update',
    DELETE: 'PermissionConfigs.designation.delete'
  },
  
  // Equipment
  'src/app/api/equipment/route.ts': {
    POST: 'PermissionConfigs.equipment.create',
    PUT: 'PermissionConfigs.equipment.update',
    DELETE: 'PermissionConfigs.equipment.delete'
  },
  
  // Equipment Maintenance
  'src/app/api/maintenance/route.ts': {
    POST: 'PermissionConfigs.maintenance.create'
  },
  
  'src/app/api/maintenance/[id]/route.ts': {
    PUT: 'PermissionConfigs.maintenance.update',
    DELETE: 'PermissionConfigs.maintenance.delete'
  },
  
  'src/app/api/maintenance/[id]/items/route.ts': {
    POST: 'PermissionConfigs.maintenance.create'
  },
  
  // Locations
  'src/app/api/locations/route.ts': {
    GET: 'PermissionConfigs.location.read',
    POST: 'PermissionConfigs.location.create'
  },
  
  // Projects
  'src/app/api/projects/route.ts': {
    GET: 'PermissionConfigs.project.read',
    POST: 'PermissionConfigs.project.create',
    PUT: 'PermissionConfigs.project.update',
    DELETE: 'PermissionConfigs.project.delete'
  },
  
  // Settings
  'src/app/api/settings/route.ts': {
    GET: 'PermissionConfigs.settings.read',
    POST: 'PermissionConfigs.settings.create',
    PUT: 'PermissionConfigs.settings.update',
    DELETE: 'PermissionConfigs.settings.delete'
  },
  
  // Timesheets
  'src/app/api/timesheets/bulk-approve/route.ts': {
    POST: 'PermissionConfigs.timesheet.approve'
  },
  
  'src/app/api/timesheets/[id]/approve/route.ts': {
    POST: 'PermissionConfigs.timesheet.approve'
  },
  
  'src/app/api/timesheets/[id]/reject/route.ts': {
    POST: 'PermissionConfigs.timesheet.reject'
  },
  
  'src/app/api/timesheets/[id]/update-hours/route.ts': {
    PUT: 'PermissionConfigs.timesheet.update'
  },
  
  'src/app/api/timesheets/[id]/mark-absent/route.ts': {
    POST: 'PermissionConfigs.timesheet.update'
  },
  
  // Users
  'src/app/api/users/route.ts': {
    GET: 'PermissionConfigs.user.read',
    POST: 'PermissionConfigs.user.create',
    PUT: 'PermissionConfigs.user.update',
    DELETE: 'PermissionConfigs.user.delete'
  },
  
  // Quotations
  'src/app/api/quotations/terms/route.ts': {
    POST: 'PermissionConfigs.quotation.create'
  },
  
  // Employee Leaves
  'src/app/api/employees/[id]/leaves/route.ts': {
    GET: 'PermissionConfigs.leave.read',
    POST: 'PermissionConfigs.leave.create'
  },
  
  // Advances
  'src/app/api/advances/approve/route.ts': {
    POST: 'PermissionConfigs.advance.approve'
  },
  
  // Assignments
  'src/app/api/assignments/approve/route.ts': {
    POST: 'PermissionConfigs.assignment.approve'
  }
};

function fixApiPermissions() {
  console.log('🔧 Fixing API route permissions...\n');
  
  let totalFixed = 0;
  let totalErrors = 0;
  
  for (const [filePath, permissions] of Object.entries(apiPermissions)) {
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        continue;
      }
      
      let content = fs.readFileSync(filePath, 'utf8');
      let fileModified = false;
      
      for (const [method, permission] of Object.entries(permissions)) {
        // Find withPermission calls without permission config
        const regex = new RegExp(`export const ${method} = withPermission\\(async`, 'g');
        if (regex.test(content)) {
          // Replace with proper permission config
          const oldPattern = `export const ${method} = withPermission(async`;
          const newPattern = `export const ${method} = withPermission(async`;
          
          if (content.includes(oldPattern)) {
            // Check if permission is already set
            const fullMethodRegex = new RegExp(`export const ${method} = withPermission\\([^)]*\\)`, 'g');
            const methodMatch = content.match(fullMethodRegex);
            
            if (methodMatch && methodMatch[0].includes('PermissionConfigs')) {
              console.log(`  ✅ ${filePath} - ${method} already has permission config`);
              continue;
            }
            
            // Find the method and add permission config
            const methodStart = content.indexOf(`export const ${method} = withPermission(async`);
            if (methodStart !== -1) {
              // Find the end of the withPermission call
              let parenCount = 0;
              let startPos = content.indexOf('(', methodStart);
              let endPos = startPos;
              
              for (let i = startPos; i < content.length; i++) {
                if (content[i] === '(') parenCount++;
                if (content[i] === ')') {
                  parenCount--;
                  if (parenCount === 0) {
                    endPos = i;
                    break;
                  }
                }
              }
              
              // Insert permission config
              const beforePermission = content.substring(0, startPos + 1);
              const afterPermission = content.substring(startPos + 1, endPos);
              const afterMethod = content.substring(endPos);
              
              content = beforePermission + permission + ', ' + afterPermission + afterMethod;
              fileModified = true;
              console.log(`  🔧 Fixed ${filePath} - ${method} added ${permission}`);
            }
          }
        }
      }
      
      if (fileModified) {
        fs.writeFileSync(filePath, content, 'utf8');
        totalFixed++;
      }
      
    } catch (error) {
      console.error(`❌ Error fixing ${filePath}:`, error);
      totalErrors++;
    }
  }
  
  console.log(`\n🎉 Permission fixing completed!`);
  console.log(`  ✅ Fixed: ${totalFixed} files`);
  console.log(`  ❌ Errors: ${totalErrors} files`);
}

fixApiPermissions();
