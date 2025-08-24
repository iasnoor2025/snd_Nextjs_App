import { db } from '../lib/db';
import { permissions as permissionsTable } from '../lib/drizzle/schema';

async function checkPermissions() {
  try {
    console.log('🔍 Checking current permissions in database...\n');
    
    // Get all current permissions
    const currentPermissions = await db
      .select({
        id: permissionsTable.id,
        name: permissionsTable.name,
        guardName: permissionsTable.guardName,
      })
      .from(permissionsTable)
      .orderBy(permissionsTable.name);

    console.log(`📊 Total permissions found: ${currentPermissions.length}\n`);
    
    if (currentPermissions.length > 0) {
      console.log('Current permissions:');
      currentPermissions.forEach(perm => {
        console.log(`  - ${perm.name} (${perm.guardName})`);
      });
    }

    // Define expected permissions based on the application modules
    const expectedPermissions = [
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

    console.log('\n📋 Expected permissions:');
    expectedPermissions.forEach(perm => {
      console.log(`  - ${perm}`);
    });

    // Find missing permissions
    const currentPermissionNames = currentPermissions.map(p => p.name);
    const missingPermissions = expectedPermissions.filter(perm => !currentPermissionNames.includes(perm));

    console.log('\n❌ Missing permissions:');
    if (missingPermissions.length === 0) {
      console.log('  ✅ All expected permissions are present!');
    } else {
      missingPermissions.forEach(perm => {
        console.log(`  - ${perm}`);
      });
      console.log(`\nTotal missing: ${missingPermissions.length}`);
    }

    // Find extra permissions (not in expected list)
    const extraPermissions = currentPermissionNames.filter(perm => !expectedPermissions.includes(perm));
    
    console.log('\n➕ Extra permissions (not in expected list):');
    if (extraPermissions.length === 0) {
      console.log('  ✅ No extra permissions found');
    } else {
      extraPermissions.forEach(perm => {
        console.log(`  - ${perm}`);
      });
      console.log(`\nTotal extra: ${extraPermissions.length}`);
    }

  } catch (error) {
    console.error('❌ Error checking permissions:', error);
  } finally {
    process.exit(0);
  }
}

checkPermissions();
