const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config();

// Database connection
const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);
const db = drizzle(sql);

// Current permissions from PermissionConfigs (only the ones actually used)
const CURRENT_PERMISSIONS = [
  // User permissions
  'read.User', 'create.User', 'update.User', 'delete.User', 'manage.User',
  
  // Employee permissions
  'read.Employee', 'create.Employee', 'update.Employee', 'delete.Employee', 'manage.Employee',
  
  // Customer permissions
  'read.Customer', 'create.Customer', 'update.Customer', 'delete.Customer', 'manage.Customer',
  
  // Equipment permissions
  'read.Equipment', 'create.Equipment', 'update.Equipment', 'delete.Equipment', 'manage.Equipment', 'sync.Equipment',
  
  // Project permissions
  'read.Project', 'create.Project', 'update.Project', 'delete.Project', 'manage.Project',
  
  // Rental permissions
  'read.Rental', 'create.Rental', 'update.Rental', 'delete.Rental', 'manage.Rental',
  
  // Quotation permissions
  'read.Quotation', 'create.Quotation', 'update.Quotation', 'delete.Quotation', 'manage.Quotation',
  
  // Payroll permissions
  'read.Payroll', 'create.Payroll', 'update.Payroll', 'delete.Payroll', 'manage.Payroll',
  
  // Timesheet permissions
  'read.Timesheet', 'create.Timesheet', 'update.Timesheet', 'delete.Timesheet', 'manage.Timesheet', 'approve.Timesheet', 'reject.Timesheet',
  
  // Leave permissions
  'read.Leave', 'create.Leave', 'update.Leave', 'delete.Leave', 'manage.Leave', 'approve.Leave', 'reject.Leave',
  
  // Department permissions
  'read.Department', 'create.Department', 'update.Department', 'delete.Department', 'manage.Department',
  
  // Designation permissions
  'read.Designation', 'create.Designation', 'update.Designation', 'delete.Designation', 'manage.Designation',
  
  // Company permissions
  'read.Company', 'create.Company', 'update.Company', 'delete.Company', 'manage.Company',
  
  // Settings permissions
  'read.Settings', 'create.Settings', 'update.Settings', 'delete.Settings', 'manage.Settings',
  
  // Location permissions
  'read.Location', 'create.Location', 'update.Location', 'delete.Location', 'manage.Location',
  
  // Maintenance permissions
  'read.Maintenance', 'create.Maintenance', 'update.Maintenance', 'delete.Maintenance', 'manage.Maintenance',
  
  // Safety permissions
  'read.Safety', 'create.Safety', 'update.Safety', 'delete.Safety', 'manage.Safety',
  
  // Salary Increment permissions
  'read.SalaryIncrement', 'create.SalaryIncrement', 'update.SalaryIncrement', 'delete.SalaryIncrement', 'manage.SalaryIncrement', 'approve.SalaryIncrement', 'reject.SalaryIncrement', 'apply.SalaryIncrement',
  
  // Advance permissions
  'read.Advance', 'create.Advance', 'update.Advance', 'delete.Advance', 'manage.Advance',
  
  // Assignment permissions
  'read.Assignment', 'create.Assignment', 'update.Assignment', 'delete.Assignment', 'manage.Assignment',
  
  // Report permissions
  'read.Report', 'create.Report', 'update.Report', 'delete.Report', 'manage.Report', 'export.Report',
  
  // Employee Document permissions
  'read.employee-document', 'create.employee-document', 'update.employee-document', 'delete.employee-document', 'manage.employee-document',
  
  // Document permissions (without approve/reject)
  'read.Document', 'create.Document', 'update.Document', 'delete.Document', 'manage.Document', 'upload.Document', 'download.Document',
  
  // Dashboard permissions
  'read.Dashboard', 'create.Dashboard', 'update.Dashboard', 'delete.Dashboard', 'manage.Dashboard',
  
  // Admin permissions
  'read.Admin', 'create.Admin', 'update.Admin', 'delete.Admin', 'manage.Admin',
];

async function cleanupUnusedPermissions() {
  try {
    console.log('🔍 Starting permission cleanup...');
    
    // Get all permissions from the database
    const allPermissions = await sql`
      SELECT DISTINCT name FROM permissions 
      ORDER BY name
    `;
    
    console.log(`📊 Found ${allPermissions.length} permissions in database`);
    
    // Find unused permissions
    const unusedPermissions = allPermissions
      .map(p => p.name)
      .filter(name => !CURRENT_PERMISSIONS.includes(name));
    
    console.log(`🗑️  Found ${unusedPermissions.length} unused permissions:`);
    unusedPermissions.forEach(p => console.log(`   - ${p}`));
    
    if (unusedPermissions.length === 0) {
      console.log('✅ No unused permissions found!');
      return;
    }
    
    // Remove unused permissions from role_has_permissions
    for (const permission of unusedPermissions) {
      console.log(`🗑️  Removing ${permission} from role_has_permissions...`);
      await sql`
        DELETE FROM role_has_permissions 
        WHERE permission_id = (SELECT id FROM permissions WHERE name = ${permission})
      `;
    }
    
    // Remove unused permissions from permissions table
    for (const permission of unusedPermissions) {
      console.log(`🗑️  Removing ${permission} from permissions table...`);
      await sql`
        DELETE FROM permissions 
        WHERE name = ${permission}
      `;
    }
    
    console.log(`✅ Successfully cleaned up ${unusedPermissions.length} unused permissions!`);
    
    // Show remaining permissions
    const remainingPermissions = await sql`
      SELECT name FROM permissions 
      ORDER BY name
    `;
    
    console.log(`📊 Remaining permissions: ${remainingPermissions.length}`);
    remainingPermissions.forEach(p => console.log(`   - ${p.name}`));
    
  } catch (error) {
    console.error('❌ Error during permission cleanup:', error);
  } finally {
    await sql.end();
  }
}

// Run the cleanup
cleanupUnusedPermissions();
