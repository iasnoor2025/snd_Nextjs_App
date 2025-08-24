import { config } from 'dotenv';
import { resolve } from 'path';
import { db } from '../lib/db';
import { permissions as permissionsTable, roles as rolesTable, roleHasPermissions as roleHasPermissionsTable } from '../lib/drizzle/schema';
import { eq } from 'drizzle-orm';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../../.env.local') });

// Define role-permission mappings
const rolePermissionMappings = {
  'SUPER_ADMIN': {
    // Super admin gets all permissions
    permissions: ['*', 'manage.all'],
    description: 'Full system access with all permissions'
  },
  
  'ADMIN': {
    // Admin gets management permissions for all modules
    permissions: [
      // Core system
      'manage.User', 'manage.Role', 'manage.Permission',
      'manage.Employee', 'manage.Customer', 'manage.Equipment',
      'manage.Maintenance', 'manage.Rental', 'manage.Quotation',
      'manage.Payroll', 'manage.Timesheet', 'manage.Project',
      'manage.Leave', 'manage.Department', 'manage.Designation',
      'manage.Company', 'manage.Settings', 'manage.Report',
      'manage.Safety', 'manage.SalaryIncrement', 'manage.Advance',
      'manage.Assignment', 'manage.Location', 'manage.Document',
      'manage.Analytics', 'manage.Dashboard', 'manage.Notification',
      'manage.webhook', 'manage.integration', 'manage.cron-job',
      'manage.scheduled-task', 'manage.backup', 'manage.recovery',
      'manage.audit', 'manage.compliance', 'manage.gdpr',
      'admin.system-health', 'admin.performance-monitor', 'admin.log-viewer',
      'admin.cache-manager', 'admin.user-sessions', 'admin.audit-logs',
      'admin.system-settings', 'erp.sync-customers', 'erp.sync-employees',
      'erp.sync-projects', 'erp.sync-inventory', 'erp.export-data',
      'erp.import-data', 'erp.validate-connection'
    ],
    description: 'System administration with complete management access'
  },
  
  'MANAGER': {
    // Manager gets employee management + read access to system settings
    permissions: [
      'read.User', 'manage.Employee', 'manage.Customer', 'manage.Equipment',
      'manage.Maintenance', 'manage.Rental', 'manage.Quotation',
      'read.Payroll', 'manage.Timesheet', 'manage.Project',
      'manage.Leave', 'read.Department', 'read.Designation',
      'read.Company', 'read.Settings', 'read.Report',
      'read.Safety', 'manage.SalaryIncrement', 'manage.Advance',
      'manage.Assignment', 'read.Location', 'read.Document',
      'read.Analytics', 'read.Dashboard', 'read.Notification',
      'read.webhook', 'read.integration', 'read.cron-job',
      'read.scheduled-task', 'read.backup', 'read.recovery',
      'read.audit', 'read.compliance', 'read.gdpr',
      'read.own-profile', 'update.own-profile', 'change.own-password',
      'manage.own-preferences', 'read.own-timesheet', 'update.own-timesheet',
      'submit.own-timesheet', 'read.own-leave', 'request.own-leave',
      'cancel.own-leave', 'read.employee-dashboard', 'customize.employee-dashboard',
      'export.employee-data'
    ],
    description: 'Department-level management with employee oversight'
  },
  
  'SUPERVISOR': {
    // Supervisor gets employee management + operational control
    permissions: [
      'read.User', 'manage.Employee', 'read.Customer', 'read.Equipment',
      'read.Maintenance', 'read.Rental', 'manage.Quotation',
      'read.Payroll', 'manage.Timesheet', 'manage.Project',
      'manage.Leave', 'read.Department', 'read.Designation',
      'read.Company', 'read.Settings', 'read.Report',
      'read.Safety', 'read.SalaryIncrement', 'read.Advance',
      'read.Assignment', 'read.Location', 'read.Document',
      'read.Analytics', 'read.Dashboard', 'read.Notification',
      'read.own-profile', 'update.own-profile', 'change.own-password',
      'manage.own-preferences', 'read.own-timesheet', 'update.own-timesheet',
      'submit.own-timesheet', 'read.own-leave', 'request.own-leave',
      'cancel.own-leave', 'read.employee-dashboard', 'customize.employee-dashboard',
      'export.employee-data'
    ],
    description: 'Team supervision with operational control'
  },
  
  'OPERATOR': {
    // Operator gets read access + basic operational tasks
    permissions: [
      'read.User', 'read.Employee', 'read.Customer', 'read.Equipment',
      'read.Maintenance', 'read.Rental', 'read.Quotation',
      'read.Payroll', 'read.Timesheet', 'read.Project',
      'read.Leave', 'read.Department', 'read.Designation',
      'read.Company', 'read.Settings', 'read.Report',
      'read.Safety', 'read.SalaryIncrement', 'read.Advance',
      'read.Assignment', 'read.Location', 'read.Document',
      'read.Analytics', 'read.Dashboard', 'read.Notification',
      'read.own-profile', 'update.own-profile', 'change.own-password',
      'manage.own-preferences', 'read.own-timesheet', 'update.own-timesheet',
      'submit.own-timesheet', 'read.own-leave', 'request.own-leave',
      'cancel.own-leave', 'read.employee-dashboard', 'customize.employee-dashboard',
      'export.employee-data'
    ],
    description: 'Day-to-day operations with limited administrative access'
  },
  
  'EMPLOYEE': {
    // Employee gets personal data access + timesheet submission
    permissions: [
      'read.own-profile', 'update.own-profile', 'change.own-password',
      'manage.own-preferences', 'read.own-timesheet', 'update.own-timesheet',
      'submit.own-timesheet', 'read.own-leave', 'request.own-leave',
      'cancel.own-leave', 'read.employee-dashboard', 'customize.employee-dashboard',
      'export.employee-data'
    ],
    description: 'Self-service access to personal information'
  },
  
  'USER': {
    // User gets basic read access to authorized modules
    permissions: [
      'read.own-profile', 'update.own-profile', 'change.own-password',
      'manage.own-preferences'
    ],
    description: 'Limited access for external users'
  }
};

async function assignPermissionsToRoles() {
  try {
    console.log('🔧 Assigning comprehensive permissions to roles...\n');
    
    // Get all roles
    const roles = await db
      .select({
        id: rolesTable.id,
        name: rolesTable.name,
      })
      .from(rolesTable);
    
    console.log(`📋 Found ${roles.length} roles in database:`);
    roles.forEach(role => {
      console.log(`  - ${role.name} (ID: ${role.id})`);
    });
    
    // Get all permissions
    const permissions = await db
      .select({
        id: permissionsTable.id,
        name: permissionsTable.name,
      })
      .from(permissionsTable);
    
    console.log(`\n📋 Found ${permissions.length} permissions in database`);
    
    // Create permission name to ID mapping
    const permissionMap = new Map(permissions.map(p => [p.name, p.id]));
    
    let totalAssignments = 0;
    let totalErrors = 0;
    
    for (const [roleName, roleConfig] of Object.entries(rolePermissionMappings)) {
      try {
        // Find the role in database
        const role = roles.find(r => r.name.toUpperCase() === roleName);
        if (!role) {
          console.log(`⚠️  Role not found: ${roleName}`);
          continue;
        }
        
        console.log(`\n🔧 Processing role: ${roleName} (${roleConfig.description})`);
        
        // Get current permissions for this role
        const currentRolePermissions = await db
          .select({
            permissionId: roleHasPermissionsTable.permissionId,
          })
          .from(roleHasPermissionsTable)
          .where(eq(roleHasPermissionsTable.roleId, role.id));
        
        const currentPermissionIds = currentRolePermissions.map(rp => rp.permissionId);
        
        // Process each permission for this role
        for (const permissionName of roleConfig.permissions) {
          try {
            const permissionId = permissionMap.get(permissionName);
            if (!permissionId) {
              console.log(`  ⚠️  Permission not found: ${permissionName}`);
              continue;
            }
            
            // Check if permission is already assigned
            if (currentPermissionIds.includes(permissionId)) {
              console.log(`  ✅ Already assigned: ${permissionName}`);
              continue;
            }
            
            // Assign permission to role
            await db
              .insert(roleHasPermissionsTable)
              .values({
                roleId: role.id,
                permissionId: permissionId,
              });
            
            console.log(`  🔧 Assigned: ${permissionName}`);
            totalAssignments++;
            
          } catch (error) {
            if (error.code === '23505') { // Unique constraint violation
              console.log(`  ✅ Already assigned: ${permissionName}`);
            } else {
              console.log(`  ❌ Failed to assign: ${permissionName} - ${error.message}`);
              totalErrors++;
            }
          }
        }
        
        // Show final count for this role
        const finalRolePermissions = await db
          .select({
            permissionId: roleHasPermissionsTable.permissionId,
          })
          .from(roleHasPermissionsTable)
          .where(eq(roleHasPermissionsTable.roleId, role.id));
        
        console.log(`  📊 Total permissions for ${roleName}: ${finalRolePermissions.length}`);
        
      } catch (error) {
        console.error(`❌ Error processing role ${roleName}:`, error);
        totalErrors++;
      }
    }
    
    console.log(`\n🎉 Role permission assignment completed!`);
    console.log(`  ✅ Successfully assigned: ${totalAssignments} permissions`);
    console.log(`  ❌ Errors: ${totalErrors}`);
    
    // Show final summary
    console.log(`\n📊 Final role permission summary:`);
    for (const role of roles) {
      const rolePermissions = await db
        .select({
          permissionId: roleHasPermissionsTable.permissionId,
        })
        .from(roleHasPermissionsTable)
        .where(eq(roleHasPermissionsTable.roleId, role.id));
      
      console.log(`  ${role.name}: ${rolePermissions.length} permissions`);
    }
    
  } catch (error) {
    console.error('❌ Error assigning permissions to roles:', error);
  } finally {
    process.exit(0);
  }
}

assignPermissionsToRoles();
