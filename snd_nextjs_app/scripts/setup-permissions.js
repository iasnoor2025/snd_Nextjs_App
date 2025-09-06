const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { permissions, roles: rolesTable, roleHasPermissions, modelHasRoles } = require('../drizzle/schema.ts');

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:fAfab9Ckow7o3yp2EhryEYKzHbyeMifPBHxi8Xb4f9sdnBgMI47Ytdaq2NWDCxy5@192.168.8.4:5432/snd_nextjs_db';
const sql = postgres(connectionString);
const db = drizzle(sql);

// Define all permissions
const allPermissions = [
  // Core system permissions
  '*',
  'manage.all',
  'sync.all',
  'reset.all',
  
  // User management
  'create.User', 'read.User', 'update.User', 'delete.User', 'manage.User',
  'create.Role', 'read.Role', 'update.Role', 'delete.Role', 'manage.Role',
  'create.Permission', 'read.Permission', 'update.Permission', 'delete.Permission', 'manage.Permission',
  
  // Employee management
  'create.Employee', 'read.Employee', 'update.Employee', 'delete.Employee', 'manage.Employee',
  'create.employee-document', 'read.employee-document', 'update.employee-document', 'delete.employee-document', 'manage.employee-document',
  'create.employee-assignment', 'read.employee-assignment', 'update.employee-assignment', 'delete.employee-assignment', 'manage.employee-assignment',
  'create.employee-leave', 'read.employee-leave', 'update.employee-leave', 'delete.employee-leave', 'manage.employee-leave',
  'create.employee-salary', 'read.employee-salary', 'update.employee-salary', 'delete.employee-salary', 'manage.employee-salary',
  'create.employee-skill', 'read.employee-skill', 'update.employee-skill', 'delete.employee-skill', 'manage.employee-skill',
  'create.employee-training', 'read.employee-training', 'update.employee-training', 'delete.employee-training', 'manage.employee-training',
  'create.employee-performance', 'read.employee-performance', 'update.employee-performance', 'delete.employee-performance', 'manage.employee-performance',
  'create.employee-resignation', 'read.employee-resignation', 'update.employee-resignation', 'delete.employee-resignation', 'manage.employee-resignation',
  
  // Customer management
  'create.Customer', 'read.Customer', 'update.Customer', 'delete.Customer', 'manage.Customer',
  'create.customer-document', 'read.customer-document', 'update.customer-document', 'delete.customer-document', 'manage.customer-document',
  'create.customer-project', 'read.customer-project', 'update.customer-project', 'delete.customer-project', 'manage.customer-project',
  
     // Equipment management
   'create.Equipment', 'read.Equipment', 'update.Equipment', 'delete.Equipment', 'manage.Equipment',
   'create.equipment-rental', 'read.equipment-rental', 'update.equipment-rental', 'delete.equipment-rental', 'manage.equipment-rental',
   'create.equipment-maintenance', 'read.equipment-maintenance', 'update.equipment-maintenance', 'delete.equipment-maintenance', 'manage.equipment-maintenance',
   'create.equipment-history', 'read.equipment-history', 'update.equipment-history', 'delete.equipment-history', 'manage.equipment-history',
   'create.equipment-document', 'read.equipment-document', 'update.equipment-document', 'delete.equipment-document', 'manage.equipment-document',
  
  // Maintenance management
  'create.Maintenance', 'read.Maintenance', 'update.Maintenance', 'delete.Maintenance', 'manage.Maintenance',
  'create.maintenance-item', 'read.maintenance-item', 'update.maintenance-item', 'delete.maintenance-item', 'manage.maintenance-item',
  'create.maintenance-schedule', 'read.maintenance-schedule', 'update.maintenance-schedule', 'delete.maintenance-schedule', 'manage.maintenance-schedule',
  
  // Rental management
  'create.Rental', 'read.Rental', 'update.Rental', 'delete.Rental', 'manage.Rental',
  'create.rental-item', 'read.rental-item', 'update.rental-item', 'delete.rental-item', 'manage.rental-item',
  'create.rental-history', 'read.rental-history', 'update.rental-history', 'delete.rental-history', 'manage.rental-history',
  'create.rental-contract', 'read.rental-contract', 'update.rental-contract', 'delete.rental-contract', 'manage.rental-contract',
  
  // Quotation management
  'create.Quotation', 'read.Quotation', 'update.Quotation', 'delete.Quotation', 'manage.Quotation',
  'create.quotation-term', 'read.quotation-term', 'update.quotation-term', 'delete.quotation-term', 'manage.quotation-term',
  'create.quotation-item', 'read.quotation-item', 'update.quotation-item', 'delete.quotation-item', 'manage.quotation-item',
  
  // Payroll management
  'create.Payroll', 'read.Payroll', 'update.Payroll', 'delete.Payroll', 'manage.Payroll',
  'create.payroll-item', 'read.payroll-item', 'update.payroll-item', 'delete.payroll-item', 'manage.payroll-item',
  'create.payroll-run', 'read.payroll-run', 'update.payroll-run', 'delete.payroll-run', 'manage.payroll-run',
  'create.tax-document', 'read.tax-document', 'update.tax-document', 'delete.tax-document', 'manage.tax-document',
  
  // Timesheet management
  'create.Timesheet', 'read.Timesheet', 'update.Timesheet', 'delete.Timesheet', 'manage.Timesheet',
  'create.time-entry', 'read.time-entry', 'update.time-entry', 'delete.time-entry', 'manage.time-entry',
  'create.weekly-timesheet', 'read.weekly-timesheet', 'update.weekly-timesheet', 'delete.weekly-timesheet', 'manage.weekly-timesheet',
  'create.timesheet-approval', 'read.timesheet-approval', 'update.timesheet-approval', 'delete.timesheet-approval', 'manage.timesheet-approval',
  'approve.Timesheet', 'reject.Timesheet',
  
  // Project management
  'create.Project', 'read.Project', 'update.Project', 'delete.Project', 'manage.Project',
  'create.project-task', 'read.project-task', 'update.project-task', 'delete.project-task', 'manage.project-task',
  'create.project-milestone', 'read.project-milestone', 'update.project-milestone', 'delete.project-milestone', 'manage.project-milestone',
  'create.project-template', 'read.project-template', 'update.project-template', 'delete.project-template', 'manage.project-template',
  'create.project-risk', 'read.project-risk', 'update.project-risk', 'delete.project-risk', 'manage.project-risk',
  'create.project-manpower', 'read.project-manpower', 'update.project-manpower', 'delete.project-manpower', 'manage.project-manpower',
  'create.project-equipment', 'read.project-equipment', 'update.project-equipment', 'delete.project-equipment', 'manage.project-equipment',
  'create.project-material', 'read.project-material', 'update.project-material', 'delete.project-material', 'manage.project-material',
  'create.project-fuel', 'read.project-fuel', 'update.project-fuel', 'delete.project-fuel', 'manage.project-fuel',
  'create.project-expense', 'read.project-expense', 'update.project-expense', 'delete.project-expense', 'manage.project-expense',
  'create.project-subcontractor', 'read.project-subcontractor', 'update.project-subcontractor', 'delete.project-subcontractor', 'manage.project-subcontractor',
  
  // Leave management
  'create.Leave', 'read.Leave', 'update.Leave', 'delete.Leave', 'manage.Leave',
  'create.time-off-request', 'read.time-off-request', 'update.time-off-request', 'delete.time-off-request', 'manage.time-off-request',
  'approve.Leave', 'reject.Leave',
  
  // Department and designation
  'create.Department', 'read.Department', 'update.Department', 'delete.Department', 'manage.Department',
  'create.Designation', 'read.Designation', 'update.Designation', 'delete.Designation', 'manage.Designation',
  'create.organizational-unit', 'read.organizational-unit', 'update.organizational-unit', 'delete.organizational-unit', 'manage.organizational-unit',
  
  // Report management
  'create.Report', 'read.Report', 'update.Report', 'delete.Report', 'manage.Report',
  'create.report-template', 'read.report-template', 'update.report-template', 'delete.report-template', 'manage.report-template',
  'create.scheduled-report', 'read.scheduled-report', 'update.scheduled-report', 'delete.scheduled-report', 'manage.scheduled-report',
  
  'export.Report', 'import.Report',
  
  // Settings management
  'create.Settings', 'read.Settings', 'update.Settings', 'delete.Settings', 'manage.Settings',
  'create.system-setting', 'read.system-setting', 'update.system-setting', 'delete.system-setting', 'manage.system-setting',
  
  // Company management
  'create.Company', 'read.Company', 'update.Company', 'delete.Company', 'manage.Company',
  'create.company-document', 'read.company-document', 'update.company-document', 'delete.company-document', 'manage.company-document',
  'create.company-document-type', 'read.company-document-type', 'update.company-document-type', 'delete.company-document-type', 'manage.company-document-type',
  
  // Safety management
  'create.Safety', 'read.Safety', 'update.Safety', 'delete.Safety', 'manage.Safety',
  'create.safety-incident', 'read.safety-incident', 'update.safety-incident', 'delete.safety-incident', 'manage.safety-incident',
  'create.safety-report', 'read.safety-report', 'update.safety-report', 'delete.safety-report', 'manage.safety-report',
  
  // Salary increment management
  'create.SalaryIncrement', 'read.SalaryIncrement', 'update.SalaryIncrement', 'delete.SalaryIncrement', 'manage.SalaryIncrement',
  'approve.SalaryIncrement', 'reject.SalaryIncrement',
  
  // Advance management
  'create.Advance', 'read.Advance', 'update.Advance', 'delete.Advance', 'manage.Advance',
  'create.advance-payment', 'read.advance-payment', 'update.advance-payment', 'delete.advance-payment', 'manage.advance-payment',
  'create.advance-history', 'read.advance-history', 'update.advance-history', 'delete.advance-history', 'manage.advance-history',
  'approve.Advance', 'reject.Advance',
  
  // Assignment management
  'create.Assignment', 'read.Assignment', 'update.Assignment', 'delete.Assignment', 'manage.Assignment',
  'approve.Assignment', 'reject.Assignment',
  
  // Iqama management
  'create.Iqama', 'read.Iqama', 'update.Iqama', 'delete.Iqama', 'manage.Iqama',
  'approve.Iqama', 'reject.Iqama', 'renew.Iqama', 'expire.Iqama',
  'create.iqama-application', 'read.iqama-application', 'update.iqama-application', 'delete.iqama-application', 'manage.iqama-application',
  'create.iqama-renewal', 'read.iqama-renewal', 'update.iqama-renewal', 'delete.iqama-renewal', 'manage.iqama-renewal',
  'create.iqama-expiry', 'read.iqama-expiry', 'update.iqama-expiry', 'delete.iqama-expiry', 'manage.iqama-expiry',
  
  // Location management
  'create.Location', 'read.Location', 'update.Location', 'delete.Location', 'manage.Location',
  'create.geofence-zone', 'read.geofence-zone', 'update.geofence-zone', 'delete.geofence-zone', 'manage.geofence-zone',
  
  // Document management
  'create.Document', 'read.Document', 'update.Document', 'delete.Document', 'manage.Document',
  'create.document-version', 'read.document-version', 'update.document-version', 'delete.document-version', 'manage.document-version',
  'create.document-approval', 'read.document-approval', 'update.document-approval', 'delete.document-approval', 'manage.document-approval',
  
  // File management
  'create.file', 'read.file', 'update.file', 'delete.file', 'manage.file',
  'create.image', 'read.image', 'update.image', 'delete.image', 'manage.image',
  'create.video', 'read.video', 'update.video', 'delete.video', 'manage.video',
  'create.audio', 'read.audio', 'update.audio', 'delete.audio', 'manage.audio',
  

  'create.Dashboard', 'read.Dashboard', 'update.Dashboard', 'delete.Dashboard', 'manage.Dashboard',
  
  // Notification management
  'create.Notification', 'read.Notification', 'update.Notification', 'delete.Notification', 'manage.Notification',
  
  // Integration and webhook management
  'create.webhook', 'read.webhook', 'update.webhook', 'delete.webhook', 'manage.webhook',
  'create.integration', 'read.integration', 'update.integration', 'delete.integration', 'manage.integration',
  'create.external-system', 'read.external-system', 'update.external-system', 'delete.external-system', 'manage.external-system',
  
  // System operations
  'create.cron-job', 'read.cron-job', 'update.cron-job', 'delete.cron-job', 'manage.cron-job',
  'create.scheduled-task', 'read.scheduled-task', 'update.scheduled-task', 'delete.scheduled-task', 'manage.scheduled-task',
  
  // Translation and language management
  'create.translation', 'read.translation', 'update.translation', 'delete.translation', 'manage.translation',
  'create.language', 'read.language', 'update.language', 'delete.language', 'manage.language',
  
  // Personal permissions
  'read.own-profile', 'update.own-profile',
  'read.own-preferences', 'update.own-preferences',
  'read.own-timesheet', 'update.own-timesheet',
  'read.own-leave', 'update.own-leave',
  'read.employee-dashboard', 'read.employee-data',
  
  // Bulk operations
  'bulk.create', 'bulk.update', 'bulk.delete',
  'mass.import', 'mass.export',
  
  // Override and emergency permissions
  'override.permissions', 'bypass.security',
  'emergency.access', 'audit.system',
  'compliance.override', 'gdpr.access',
  'backup.system', 'recovery.system',
  'create.backup', 'read.backup', 'update.backup', 'delete.backup', 'manage.backup',
  'download.backup', 'restore.backup', 'schedule.backup',
];

// Define roles
const roles = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGER',
  'SUPERVISOR',
  'OPERATOR',
  'EMPLOYEE',
  'USER',
  'PROJECT_LEADER',
  'FINANCE_SPECIALIST',
  'HR_SPECIALIST',
  'SALES_REPRESENTATIVE',
];

// Define role permissions mapping
const rolePermissions = {
  SUPER_ADMIN: ['*', 'manage.all'],
  ADMIN: [
    'manage.User', 'manage.Employee', 'manage.Customer', 'manage.Equipment',
    'manage.Rental', 'manage.Quotation', 'manage.Payroll', 'manage.Timesheet',
    'manage.Project', 'manage.Leave', 'manage.Department', 'manage.Designation',
    'manage.Report', 'manage.Settings', 'manage.Company', 'manage.Safety',
    'manage.employee-document', 'manage.equipment-document', 'manage.SalaryIncrement', 'manage.Advance',
    'manage.Assignment', 'manage.Location', 'manage.Maintenance', 'manage.Iqama',
    'read.own-profile', 'update.own-profile'
  ],
  MANAGER: [
    'read.User', 'manage.Employee', 'manage.Customer', 'manage.Equipment',
    'manage.Rental', 'manage.Quotation', 'read.Payroll', 'manage.Timesheet',
    'manage.Project', 'manage.Leave', 'read.Department', 'read.Designation',
    'read.Report', 'read.Settings', 'read.Company', 'read.Safety',
    'manage.employee-document', 'manage.equipment-document', 'manage.SalaryIncrement', 'manage.Advance',
    'manage.Assignment', 'read.Location', 'read.Maintenance', 'manage.Iqama',
    'read.own-profile', 'update.own-profile'
  ],
  SUPERVISOR: [
    'read.User', 'manage.Employee', 'read.Customer', 'read.Equipment',
    'read.Rental', 'manage.Quotation', 'read.Payroll', 'manage.Timesheet',
    'manage.Project', 'manage.Leave', 'read.Department', 'read.Designation',
    'read.Report', 'read.Settings', 'read.Company', 'read.Safety',
    'manage.employee-document', 'read.equipment-document', 'read.SalaryIncrement', 'read.Advance',
    'read.Assignment', 'read.Location', 'read.Maintenance', 'manage.Iqama',
    'read.own-profile', 'update.own-profile'
  ],
  OPERATOR: [
    'read.User', 'read.Employee', 'read.Customer', 'read.Equipment',
    'read.Rental', 'read.Quotation', 'read.Payroll', 'read.Timesheet',
    'read.Project', 'read.Leave', 'read.Department', 'read.Designation',
    'read.Report', 'read.Settings', 'read.Company', 'read.Safety',
    'read.employee-document', 'read.equipment-document', 'read.SalaryIncrement', 'read.Advance',
    'read.Assignment', 'read.Location', 'read.Maintenance', 'read.Iqama',
    'read.own-profile', 'update.own-profile'
  ],
  EMPLOYEE: [
    'read.User', 'read.Employee', 'read.Customer', 'read.Equipment',
    'read.Rental', 'read.Quotation', 'read.Payroll', 'manage.Timesheet',
    'read.Project', 'manage.Leave', 'read.Department', 'read.Designation',
    'read.Report', 'read.Settings', 'read.Company', 'manage.employee-document',
    'read.equipment-document', 'read.SalaryIncrement', 'read.own-profile', 'update.own-profile',
    'read.own-preferences', 'update.own-preferences', 'read.own-timesheet',
    'update.own-timesheet', 'read.own-leave', 'update.own-leave',
    'read.employee-dashboard', 'read.employee-data'
  ],
  USER: [
    'read.User', 'read.Employee', 'read.Customer', 'read.Equipment',
    'read.Rental', 'read.Quotation', 'read.Timesheet', 'read.Project',
    'read.Leave', 'read.Department', 'read.Settings', 'read.Report',
    'read.Company', 'read.employee-document', 'read.equipment-document', 'read.SalaryIncrement',
    'read.own-profile', 'update.own-profile'
  ],
  PROJECT_LEADER: [
    'manage.Project', 'manage.project-task', 'manage.project-milestone',
    'read.Employee', 'read.Timesheet', 'read.Report'
  ],
  FINANCE_SPECIALIST: [
    'read.Payroll', 'read.SalaryIncrement', 'read.Advance', 'read.Report',
    'read.Employee', 'export.Report'
  ],
  HR_SPECIALIST: [
    'read.Employee', 'read.Leave', 'read.performance-review', 'read.Training',
    'read.Report', 'read.User'
  ],
  SALES_REPRESENTATIVE: [
    'read.Customer', 'manage.Quotation', 'read.Project', 'read.Report',
    'export.Report'
  ],
};

async function setupPermissions() {
  try {
    console.log('🚀 Starting permission setup...');
    
    // Clear existing permissions and roles
    console.log('🗑️ Clearing existing permissions and roles...');
    await sql`DELETE FROM role_has_permissions`;
    await sql`DELETE FROM model_has_permissions`;
    await sql`DELETE FROM permissions`;
    await sql`DELETE FROM model_has_roles`;
    await sql`DELETE FROM roles`;
    
    // Create permissions
    console.log('📝 Creating permissions...');
    for (const permissionName of allPermissions) {
      await db.insert(permissions).values({
        name: permissionName,
        guardName: 'web',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    console.log(`✅ Created ${allPermissions.length} permissions`);
    
    // Create roles
    console.log('👑 Creating roles...');
    const createdRoles = {};
    for (const roleName of roles) {
      const [role] = await db.insert(rolesTable).values({
        name: roleName,
        guardName: 'web',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      createdRoles[roleName] = role.id;
    }
    console.log(`✅ Created ${roles.length} roles`);
    
    // Assign permissions to roles
    console.log('🔗 Assigning permissions to roles...');
    let totalAssignments = 0;
    for (const [roleName, permissionNames] of Object.entries(rolePermissions)) {
      const roleId = createdRoles[roleName];
      if (!roleId) continue;
      
      for (const permissionName of permissionNames) {
        // Find permission ID
        const [permission] = await db
          .select({ id: permissions.id })
          .from(permissions)
          .where(sql`${permissions.name} = ${permissionName}`);
        
        if (permission) {
          await db.insert(roleHasPermissions).values({
            roleId: roleId,
            permissionId: permission.id,
          });
          totalAssignments++;
        }
      }
    }
    console.log(`✅ Created ${totalAssignments} role-permission assignments`);
    
    console.log('🎉 Permission setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up permissions:', error);
    throw error;
  }
}

// Run the setup
if (require.main === module) {
  setupPermissions()
    .then(() => {
      console.log('✅ Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupPermissions };
