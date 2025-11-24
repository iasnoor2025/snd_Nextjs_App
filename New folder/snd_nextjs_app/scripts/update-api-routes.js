const fs = require('fs');
const path = require('path');

// Define the mapping of old imports to new imports
const importMappings = {
  'withAuth': 'withPermission, PermissionConfigs',
  'withReadPermission': 'withReadPermission',
  'withPermission': 'withPermission, PermissionConfigs'
};

// Define the permission mappings for different routes
const routePermissionMappings = {
  // Employee routes
  'employees': {
    'GET': 'PermissionConfigs.employee.read',
    'POST': 'PermissionConfigs.employee.create',
    'PUT': 'PermissionConfigs.employee.update',
    'DELETE': 'PermissionConfigs.employee.delete'
  },
  'employees/[id]': {
    'GET': 'PermissionConfigs.employee.read',
    'PUT': 'PermissionConfigs.employee.update',
    'DELETE': 'PermissionConfigs.employee.delete'
  },
  
  // User routes
  'users': {
    'GET': 'PermissionConfigs.user.read',
    'POST': 'PermissionConfigs.user.create',
    'PUT': 'PermissionConfigs.user.update',
    'DELETE': 'PermissionConfigs.user.delete'
  },
  
  // Customer routes
  'customers': {
    'GET': 'PermissionConfigs.customer.read',
    'POST': 'PermissionConfigs.customer.create',
    'PUT': 'PermissionConfigs.customer.update',
    'DELETE': 'PermissionConfigs.customer.delete'
  },
  
  // Equipment routes
  'equipment': {
    'GET': 'PermissionConfigs.equipment.read',
    'POST': 'PermissionConfigs.equipment.create',
    'PUT': 'PermissionConfigs.equipment.update',
    'DELETE': 'PermissionConfigs.equipment.delete'
  },
  
  // Project routes
  'projects': {
    'GET': 'PermissionConfigs.project.read',
    'POST': 'PermissionConfigs.project.create',
    'PUT': 'PermissionConfigs.project.update',
    'DELETE': 'PermissionConfigs.project.delete'
  },
  
  // Rental routes
  'rentals': {
    'GET': 'PermissionConfigs.rental.read',
    'POST': 'PermissionConfigs.rental.create',
    'PUT': 'PermissionConfigs.rental.update',
    'DELETE': 'PermissionConfigs.rental.delete'
  },
  
  // Quotation routes
  'quotations': {
    'GET': 'PermissionConfigs.quotation.read',
    'POST': 'PermissionConfigs.quotation.create',
    'PUT': 'PermissionConfigs.quotation.update',
    'DELETE': 'PermissionConfigs.quotation.delete'
  },
  
  // Payroll routes
  'payroll': {
    'GET': 'PermissionConfigs.payroll.read',
    'POST': 'PermissionConfigs.payroll.create',
    'PUT': 'PermissionConfigs.payroll.update',
    'DELETE': 'PermissionConfigs.payroll.delete'
  },
  
  // Timesheet routes
  'timesheets': {
    'GET': 'PermissionConfigs.timesheet.read',
    'POST': 'PermissionConfigs.timesheet.create',
    'PUT': 'PermissionConfigs.timesheet.update',
    'DELETE': 'PermissionConfigs.timesheet.delete'
  },
  
  // Leave routes
  'leave-requests': {
    'GET': 'PermissionConfigs.leave.read',
    'POST': 'PermissionConfigs.leave.create',
    'PUT': 'PermissionConfigs.leave.update',
    'DELETE': 'PermissionConfigs.leave.delete'
  },
  
  // Department routes
  'departments': {
    'GET': 'PermissionConfigs.department.read',
    'POST': 'PermissionConfigs.department.create',
    'PUT': 'PermissionConfigs.department.update',
    'DELETE': 'PermissionConfigs.department.delete'
  },
  
  // Designation routes
  'designations': {
    'GET': 'PermissionConfigs.designation.read',
    'POST': 'PermissionConfigs.designation.create',
    'PUT': 'PermissionConfigs.designation.update',
    'DELETE': 'PermissionConfigs.designation.delete'
  },
  
  // Company routes
  'companies': {
    'GET': 'PermissionConfigs.company.read',
    'POST': 'PermissionConfigs.company.create',
    'PUT': 'PermissionConfigs.company.update',
    'DELETE': 'PermissionConfigs.company.delete'
  },
  
  // Settings routes
  'settings': {
    'GET': 'PermissionConfigs.settings.read',
    'POST': 'PermissionConfigs.settings.create',
    'PUT': 'PermissionConfigs.settings.update',
    'DELETE': 'PermissionConfigs.settings.delete'
  },
  
  // Location routes
  'locations': {
    'GET': 'PermissionConfigs.location.read',
    'POST': 'PermissionConfigs.location.create',
    'PUT': 'PermissionConfigs.location.update',
    'DELETE': 'PermissionConfigs.location.delete'
  },
  
  // Maintenance routes
  'maintenance': {
    'GET': 'PermissionConfigs.maintenance.read',
    'POST': 'PermissionConfigs.maintenance.create',
    'PUT': 'PermissionConfigs.maintenance.update',
    'DELETE': 'PermissionConfigs.maintenance.delete'
  },
  
  // Safety routes
  'safety-incidents': {
    'GET': 'PermissionConfigs.safety.read',
    'POST': 'PermissionConfigs.safety.create',
    'PUT': 'PermissionConfigs.safety.update',
    'DELETE': 'PermissionConfigs.safety.delete'
  },
  
  // Salary increment routes
  'salary-increments': {
    'GET': 'PermissionConfigs.salaryIncrement.read',
    'POST': 'PermissionConfigs.salaryIncrement.create',
    'PUT': 'PermissionConfigs.salaryIncrement.update',
    'DELETE': 'PermissionConfigs.salaryIncrement.delete'
  },
  
  // Advance routes
  'advances': {
    'GET': 'PermissionConfigs.advance.read',
    'POST': 'PermissionConfigs.advance.create',
    'PUT': 'PermissionConfigs.advance.update',
    'DELETE': 'PermissionConfigs.advance.delete'
  },
  
  // Assignment routes
  'assignments': {
    'GET': 'PermissionConfigs.assignment.read',
    'POST': 'PermissionConfigs.assignment.create',
    'PUT': 'PermissionConfigs.assignment.update',
    'DELETE': 'PermissionConfigs.assignment.delete'
  },
  

    'GET': 'PermissionConfigs.report.read'
  },
  'reports': {
    'GET': 'PermissionConfigs.report.read'
  }
};

function updateRouteFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Update imports
    if (content.includes('import { withAuth }')) {
      content = content.replace(
        'import { withAuth } from \'@/lib/rbac/api-middleware\';',
        'import { withPermission, PermissionConfigs } from \'@/lib/rbac/api-middleware\';'
      );
      updated = true;
    }
    
    if (content.includes('import { withReadPermission }')) {
      content = content.replace(
        'import { withReadPermission } from \'@/lib/rbac/api-middleware\';',
        'import { withReadPermission } from \'@/lib/rbac/api-middleware\';'
      );
      updated = true;
    }
    
    // Update export statements
    const routeName = path.basename(path.dirname(filePath));
    const permissions = routePermissionMappings[routeName];
    
    if (permissions) {
      // Update GET exports
      if (content.includes('export const GET = withAuth(') && permissions.GET) {
        content = content.replace(
          'export const GET = withAuth(',
          `export const GET = withPermission(${permissions.GET})(`
        );
        updated = true;
      }
      
      // Update POST exports
      if (content.includes('export const POST = withAuth(') && permissions.POST) {
        content = content.replace(
          'export const POST = withAuth(',
          `export const POST = withPermission(${permissions.POST})(`
        );
        updated = true;
      }
      
      // Update PUT exports
      if (content.includes('export const PUT = withAuth(') && permissions.PUT) {
        content = content.replace(
          'export const PUT = withAuth(',
          `export const PUT = withPermission(${permissions.PUT})(`
        );
        updated = true;
      }
      
      // Update DELETE exports
      if (content.includes('export const DELETE = withAuth(') && permissions.DELETE) {
        content = content.replace(
          'export const DELETE = withAuth(',
          `export const DELETE = withPermission(${permissions.DELETE})(`
        );
        updated = true;
      }
      
      // Update withReadPermission exports
      if (content.includes('export const GET = withReadPermission(')) {
        const subject = permissions.GET ? permissions.GET.split('.')[1] : 'Employee';
        content = content.replace(
          'export const GET = withReadPermission(',
          `export const GET = withReadPermission('${subject}')`
        );
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

function findAndUpdateRoutes(dir) {
  const items = fs.readdirSync(dir);
  let updatedCount = 0;
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Check if this is an API route directory
      if (item.startsWith('[') || item.includes('-') || item === 'employees' || item === 'users' || item === 'customers' || item === 'equipment' || item === 'projects' || item === 'rentals' || item === 'quotations' || item === 'payroll' || item === 'timesheets' || item === 'leave-requests' || item === 'departments' || item === 'designations' || item === 'companies' || item === 'settings' || item === 'locations' || item === 'maintenance' || item === 'safety-incidents' || item === 'salary-increments' || item === 'advances' || item === 'assignments' || item === 'reports') {
        const routeFile = path.join(fullPath, 'route.ts');
        if (fs.existsSync(routeFile)) {
          if (updateRouteFile(routeFile)) {
            updatedCount++;
          }
        }
      }
      
      // Recursively check subdirectories
      updatedCount += findAndUpdateRoutes(fullPath);
    }
  }
  
  return updatedCount;
}

// Start the update process
console.log('🚀 Starting API route permission system update...\n');

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
const updatedCount = findAndUpdateRoutes(apiDir);

console.log(`\n✅ Update complete! Updated ${updatedCount} route files.`);
console.log('\n📝 Note: Some routes may need manual updates if they have complex permission requirements.');
