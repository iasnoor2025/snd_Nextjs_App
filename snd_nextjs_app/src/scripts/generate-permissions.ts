import { db } from '../lib/db';
import { permissions as permissionsTable } from '../lib/drizzle/schema';

// Define all required permissions based on the application modules
const requiredPermissions = [
  // User Management
  'create.User', 'read.User', 'update.User', 'delete.User', 'manage.User',
  
  // Employee Management
  'create.Employee', 'read.Employee', 'update.Employee', 'delete.Employee', 'manage.Employee',
  'create.employee-document', 'read.employee-document', 'update.employee-document', 'delete.employee-document', 'manage.employee-document',
  'create.employee-assignment', 'read.employee-assignment', 'update.employee-assignment', 'delete.employee-assignment', 'manage.employee-assignment',
  
  // Customer Management
  'create.Customer', 'read.Customer', 'update.Customer', 'delete.Customer', 'manage.Customer',
  
  // Equipment Management
  'create.Equipment', 'read.Equipment', 'update.Equipment', 'delete.Equipment', 'manage.Equipment',
  
  // Maintenance Management
  'create.Maintenance', 'read.Maintenance', 'update.Maintenance', 'delete.Maintenance', 'manage.Maintenance',
  
  // Rental Management
  'create.Rental', 'read.Rental', 'update.Rental', 'delete.Rental', 'manage.Rental',
  
  // Quotation Management
  'create.Quotation', 'read.Quotation', 'update.Quotation', 'delete.Quotation', 'manage.Quotation',
  
  // Payroll Management
  'create.Payroll', 'read.Payroll', 'update.Payroll', 'delete.Payroll', 'manage.Payroll',
  
  // Timesheet Management
  'create.Timesheet', 'read.Timesheet', 'update.Timesheet', 'delete.Timesheet', 'manage.Timesheet',
  'approve.Timesheet', 'reject.Timesheet',
  
  // Project Management
  'create.Project', 'read.Project', 'update.Project', 'delete.Project', 'manage.Project',
  
  // Leave Management
  'create.Leave', 'read.Leave', 'update.Leave', 'delete.Leave', 'manage.Leave',
  'approve.Leave', 'reject.Leave',
  
  // Department Management
  'create.Department', 'read.Department', 'update.Department', 'delete.Department', 'manage.Department',
  
  // Designation Management
  'create.Designation', 'read.Designation', 'update.Designation', 'delete.Designation', 'manage.Designation',
  
  // Company Management
  'create.Company', 'read.Company', 'update.Company', 'delete.Company', 'manage.Company',
  
  // Settings Management
  'create.Settings', 'read.Settings', 'update.Settings', 'delete.Settings', 'manage.Settings',
  
  // Reporting
  'create.Report', 'read.Report', 'update.Report', 'delete.Report', 'manage.Report',
  'export.Report', 'import.Report',
  
  // Safety Management
  'create.Safety', 'read.Safety', 'update.Safety', 'delete.Safety', 'manage.Safety',
  
  // Salary Increments
  'create.SalaryIncrement', 'read.SalaryIncrement', 'update.SalaryIncrement', 'delete.SalaryIncrement', 'manage.SalaryIncrement',
  'approve.SalaryIncrement', 'reject.SalaryIncrement', 'apply.SalaryIncrement',
  
  // Analytics
  'read.Analytics', 'export.Analytics',
  
  // Notifications
  'read.Notification', 'manage.Notification',
  
  // Location Management
  'create.Location', 'read.Location', 'update.Location', 'delete.Location', 'manage.Location',
  
  // Document Management
  'create.Document', 'read.Document', 'update.Document', 'delete.Document', 'manage.Document',
  
  // Assignment Management
  'create.Assignment', 'read.Assignment', 'update.Assignment', 'delete.Assignment', 'manage.Assignment',
  'approve.Assignment', 'reject.Assignment',
  
  // Advanced permissions
  'manage.all', '*', 'sync.all', 'reset.all'
];

async function generatePermissions() {
  try {
    console.log('🔧 Generating missing permissions...\n');
    
    // Get current permissions
    const currentPermissions = await db
      .select({
        id: permissionsTable.id,
        name: permissionsTable.name,
        guardName: permissionsTable.guardName,
      })
      .from(permissionsTable);

    const currentPermissionNames = currentPermissions.map(p => p.name);
    
    // Find missing permissions
    const missingPermissions = requiredPermissions.filter(perm => !currentPermissionNames.includes(perm));
    
    if (missingPermissions.length === 0) {
      console.log('✅ All required permissions are already present!');
      return;
    }
    
    console.log(`📋 Found ${missingPermissions.length} missing permissions:`);
    missingPermissions.forEach(perm => {
      console.log(`  - ${perm}`);
    });
    
    // Insert missing permissions
    console.log('\n🚀 Inserting missing permissions...');
    
    for (const permissionName of missingPermissions) {
      try {
        await db
          .insert(permissionsTable)
          .values({
            name: permissionName,
            guardName: 'web',
            updatedAt: new Date().toISOString(),
          });
        console.log(`  ✅ Created: ${permissionName}`);
      } catch (error) {
        console.log(`  ❌ Failed to create: ${permissionName} - ${error}`);
      }
    }
    
    console.log('\n🎉 Permission generation completed!');
    
    // Show final count
    const finalPermissions = await db
      .select({
        id: permissionsTable.id,
        name: permissionsTable.name,
      })
      .from(permissionsTable);
    
    console.log(`\n📊 Total permissions in database: ${finalPermissions.length}`);
    
  } catch (error) {
    console.error('❌ Error generating permissions:', error);
  } finally {
    process.exit(0);
  }
}

generatePermissions();
