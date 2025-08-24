import { db } from '../lib/db';
import { permissions as permissionsTable } from '../lib/drizzle/schema';

// Comprehensive list of all permissions needed for the entire application
const comprehensivePermissions = [
  // ===== CORE SYSTEM PERMISSIONS =====
  'manage.all', '*', 'sync.all', 'reset.all',
  
  // ===== USER MANAGEMENT =====
  'create.User', 'read.User', 'update.User', 'delete.User', 'manage.User',
  'create.Role', 'read.Role', 'update.Role', 'delete.Role', 'manage.Role',
  'create.Permission', 'read.Permission', 'update.Permission', 'delete.Permission', 'manage.Permission',
  
  // ===== EMPLOYEE MANAGEMENT =====
  'create.Employee', 'read.Employee', 'update.Employee', 'delete.Employee', 'manage.Employee',
  'create.employee-document', 'read.employee-document', 'update.employee-document', 'delete.employee-document', 'manage.employee-document',
  'create.employee-assignment', 'read.employee-assignment', 'update.employee-assignment', 'delete.employee-assignment', 'manage.employee-assignment',
  'create.employee-leave', 'read.employee-leave', 'update.employee-leave', 'delete.employee-leave', 'manage.employee-leave',
  'create.employee-salary', 'read.employee-salary', 'update.employee-salary', 'delete.employee-salary', 'manage.employee-salary',
  'create.employee-skill', 'read.employee-skill', 'update.employee-skill', 'delete.employee-skill', 'manage.employee-skill',
  'create.employee-training', 'read.employee-training', 'update.employee-training', 'delete.employee-training', 'manage.employee-training',
  'create.employee-performance', 'read.employee-performance', 'update.employee-performance', 'delete.employee-performance', 'manage.employee-performance',
  'create.employee-resignation', 'read.employee-resignation', 'update.employee-resignation', 'delete.employee-resignation', 'manage.employee-resignation',
  
  // ===== CUSTOMER MANAGEMENT =====
  'create.Customer', 'read.Customer', 'update.Customer', 'delete.Customer', 'manage.Customer',
  'create.customer-document', 'read.customer-document', 'update.customer-document', 'delete.customer-document', 'manage.customer-document',
  'create.customer-project', 'read.customer-project', 'update.customer-project', 'delete.customer-project', 'manage.customer-project',
  
  // ===== EQUIPMENT MANAGEMENT =====
  'create.Equipment', 'read.Equipment', 'update.Equipment', 'delete.Equipment', 'manage.Equipment',
  'create.equipment-rental', 'read.equipment-rental', 'update.equipment-rental', 'delete.equipment-rental', 'manage.equipment-rental',
  'create.equipment-maintenance', 'read.equipment-maintenance', 'update.equipment-maintenance', 'delete.equipment-maintenance', 'manage.equipment-maintenance',
  'create.equipment-history', 'read.equipment-history', 'update.equipment-history', 'delete.equipment-history', 'manage.equipment-history',
  
  // ===== MAINTENANCE MANAGEMENT =====
  'create.Maintenance', 'read.Maintenance', 'update.Maintenance', 'delete.Maintenance', 'manage.Maintenance',
  'create.maintenance-item', 'read.maintenance-item', 'update.maintenance-item', 'delete.maintenance-item', 'manage.maintenance-item',
  'create.maintenance-schedule', 'read.maintenance-schedule', 'update.maintenance-schedule', 'delete.maintenance-schedule', 'manage.maintenance-schedule',
  
  // ===== RENTAL MANAGEMENT =====
  'create.Rental', 'read.Rental', 'update.Rental', 'delete.Rental', 'manage.Rental',
  'create.rental-item', 'read.rental-item', 'update.rental-item', 'delete.rental-item', 'manage.rental-item',
  'create.rental-history', 'read.rental-history', 'update.rental-history', 'delete.rental-history', 'manage.rental-history',
  'create.rental-contract', 'read.rental-contract', 'update.rental-contract', 'delete.rental-contract', 'manage.rental-contract',
  
  // ===== QUOTATION MANAGEMENT =====
  'create.Quotation', 'read.Quotation', 'update.Quotation', 'delete.Quotation', 'manage.Quotation',
  'create.quotation-term', 'read.quotation-term', 'update.quotation-term', 'delete.quotation-term', 'manage.quotation-term',
  'create.quotation-item', 'read.quotation-item', 'update.quotation-item', 'delete.quotation-item', 'manage.quotation-item',
  'approve.Quotation', 'reject.Quotation', 'send.Quotation',
  
  // ===== PAYROLL MANAGEMENT =====
  'create.Payroll', 'read.Payroll', 'update.Payroll', 'delete.Payroll', 'manage.Payroll',
  'create.payroll-item', 'read.payroll-item', 'update.payroll-item', 'delete.payroll-item', 'manage.payroll-item',
  'create.payroll-run', 'read.payroll-run', 'update.payroll-run', 'delete.payroll-run', 'manage.payroll-run',
  'create.tax-document', 'read.tax-document', 'update.tax-document', 'delete.tax-document', 'manage.tax-document',
  'approve.Payroll', 'reject.Payroll', 'process.Payroll', 'export.Payroll',
  
  // ===== TIMESHEET MANAGEMENT =====
  'create.Timesheet', 'read.Timesheet', 'update.Timesheet', 'delete.Timesheet', 'manage.Timesheet',
  'create.time-entry', 'read.time-entry', 'update.time-entry', 'delete.time-entry', 'manage.time-entry',
  'create.weekly-timesheet', 'read.weekly-timesheet', 'update.weekly-timesheet', 'delete.weekly-timesheet', 'manage.weekly-timesheet',
  'create.timesheet-approval', 'read.timesheet-approval', 'update.timesheet-approval', 'delete.timesheet-approval', 'manage.timesheet-approval',
  'approve.Timesheet', 'reject.Timesheet', 'bulk-approve.Timesheet', 'mark-absent.Timesheet',
  
  // ===== PROJECT MANAGEMENT =====
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
  
  // ===== LEAVE MANAGEMENT =====
  'create.Leave', 'read.Leave', 'update.Leave', 'delete.Leave', 'manage.Leave',
  'create.time-off-request', 'read.time-off-request', 'update.time-off-request', 'delete.time-off-request', 'manage.time-off-request',
  'approve.Leave', 'reject.Leave', 'cancel.Leave',
  
  // ===== DEPARTMENT & ORGANIZATION =====
  'create.Department', 'read.Department', 'update.Department', 'delete.Department', 'manage.Department',
  'create.Designation', 'read.Designation', 'update.Designation', 'delete.Designation', 'manage.Designation',
  'create.organizational-unit', 'read.organizational-unit', 'update.organizational-unit', 'delete.organizational-unit', 'manage.organizational-unit',
  'create.Skill', 'read.Skill', 'update.Skill', 'delete.Skill', 'manage.Skill',
  'create.Training', 'read.Training', 'update.Training', 'delete.Training', 'manage.Training',
  
  // ===== COMPANY MANAGEMENT =====
  'create.Company', 'read.Company', 'update.Company', 'delete.Company', 'manage.Company',
  'create.company-document', 'read.company-document', 'update.company-document', 'delete.company-document', 'manage.company-document',
  'create.company-document-type', 'read.company-document-type', 'update.company-document-type', 'delete.company-document-type', 'manage.company-document-type',
  
  // ===== SETTINGS & CONFIGURATION =====
  'create.Settings', 'read.Settings', 'update.Settings', 'delete.Settings', 'manage.Settings',
  'create.system-setting', 'read.system-setting', 'update.system-setting', 'delete.system-setting', 'manage.system-setting',
  'create.country', 'read.country', 'update.country', 'delete.country', 'manage.country',
  
  // ===== REPORTING & ANALYTICS =====
  'create.Report', 'read.Report', 'update.Report', 'delete.Report', 'manage.Report',
  'create.report-template', 'read.report-template', 'update.report-template', 'delete.report-template', 'manage.report-template',
  'create.scheduled-report', 'read.scheduled-report', 'update.scheduled-report', 'delete.scheduled-report', 'manage.scheduled-report',
  'create.analytics-report', 'read.analytics-report', 'update.analytics-report', 'delete.analytics-report', 'manage.analytics-report',
  'export.Report', 'import.Report', 'schedule.Report', 'generate.Report',
  
  // ===== SAFETY MANAGEMENT =====
  'create.Safety', 'read.Safety', 'update.Safety', 'delete.Safety', 'manage.Safety',
  'create.safety-incident', 'read.safety-incident', 'update.safety-incident', 'delete.safety-incident', 'manage.safety-incident',
  'create.safety-report', 'read.safety-report', 'update.safety-report', 'delete.safety-report', 'manage.safety-report',
  'approve.Safety', 'investigate.Safety',
  
  // ===== SALARY & COMPENSATION =====
  'create.SalaryIncrement', 'read.SalaryIncrement', 'update.SalaryIncrement', 'delete.SalaryIncrement', 'manage.SalaryIncrement',
  'create.advance-payment', 'read.advance-payment', 'update.advance-payment', 'delete.advance-payment', 'manage.advance-payment',
  'create.loan', 'read.loan', 'update.loan', 'delete.loan', 'manage.loan',
  'approve.SalaryIncrement', 'reject.SalaryIncrement', 'apply.SalaryIncrement',
  'approve.advance-payment', 'reject.advance-payment', 'process.advance-payment',
  'approve.loan', 'reject.loan', 'process.loan',
  
  // ===== ANALYTICS & DASHBOARD =====
  'read.Analytics', 'export.Analytics', 'create.Analytics', 'update.Analytics', 'delete.Analytics', 'manage.Analytics',
  'read.Dashboard', 'export.Dashboard', 'customize.Dashboard',
  
  // ===== NOTIFICATIONS & COMMUNICATION =====
  'read.Notification', 'manage.Notification', 'create.Notification', 'update.Notification', 'delete.Notification',
  'send.Notification', 'read.notification-template', 'manage.notification-template',
  
  // ===== LOCATION & GEOGRAPHY =====
  'create.Location', 'read.Location', 'update.Location', 'delete.Location', 'manage.Location',
  'create.geofence-zone', 'read.geofence-zone', 'update.geofence-zone', 'delete.geofence-zone', 'manage.geofence-zone',
  
  // ===== DOCUMENT MANAGEMENT =====
  'create.Document', 'read.Document', 'update.Document', 'delete.Document', 'manage.Document',
  'create.document-version', 'read.document-version', 'update.document-version', 'delete.document-version', 'manage.document-version',
  'create.document-approval', 'read.document-approval', 'update.document-approval', 'delete.document-approval', 'manage.document-approval',
  'upload.Document', 'download.Document', 'approve.Document', 'reject.Document',
  
  // ===== ASSIGNMENT & RESOURCE MANAGEMENT =====
  'create.Assignment', 'read.Assignment', 'update.Assignment', 'delete.Assignment', 'manage.Assignment',
  'create.resource-allocation', 'read.resource-allocation', 'update.resource-allocation', 'delete.resource-allocation', 'manage.resource-allocation',
  'approve.Assignment', 'reject.Assignment', 'assign.Assignment', 'unassign.Assignment',
  
  // ===== ADVANCE & FINANCIAL MANAGEMENT =====
  'create.Advance', 'read.Advance', 'update.Advance', 'delete.Advance', 'manage.Advance',
  'create.advance-history', 'read.advance-history', 'update.advance-history', 'delete.advance-history', 'manage.advance-history',
  'approve.Advance', 'reject.Advance', 'process.Advance', 'repay.Advance',
  
  // ===== PERFORMANCE & REVIEWS =====
  'create.performance-review', 'read.performance-review', 'update.performance-review', 'delete.performance-review', 'manage.performance-review',
  'create.performance-goal', 'read.performance-goal', 'update.performance-goal', 'delete.performance-goal', 'manage.performance-goal',
  'approve.performance-review', 'conduct.performance-review',
  
  // ===== UPLOAD & FILE MANAGEMENT =====
  'upload.file', 'download.file', 'delete.file', 'manage.file',
  'upload.image', 'upload.document', 'upload.video', 'upload.audio',
  
  // ===== WEBHOOK & INTEGRATION =====
  'create.webhook', 'read.webhook', 'update.webhook', 'delete.webhook', 'manage.webhook',
  'create.integration', 'read.integration', 'update.integration', 'delete.integration', 'manage.integration',
  'sync.external-system', 'webhook.receive', 'webhook.send',
  
  // ===== CRON & SCHEDULED TASKS =====
  'create.cron-job', 'read.cron-job', 'update.cron-job', 'delete.cron-job', 'manage.cron-job',
  'create.scheduled-task', 'read.scheduled-task', 'update.scheduled-task', 'delete.scheduled-task', 'manage.scheduled-task',
  'execute.cron-job', 'schedule.task',
  
  // ===== ADMIN & SYSTEM OPERATIONS =====
  'admin.reset-database', 'admin.migrate-data', 'admin.backup-data', 'admin.restore-data',
  'admin.system-health', 'admin.performance-monitor', 'admin.log-viewer', 'admin.cache-manager',
  'admin.user-sessions', 'admin.audit-logs', 'admin.system-settings',
  
  // ===== ERP & EXTERNAL INTEGRATIONS =====
  'erp.sync-customers', 'erp.sync-employees', 'erp.sync-projects', 'erp.sync-inventory',
  'erp.export-data', 'erp.import-data', 'erp.validate-connection',
  
  // ===== TRANSLATION & LOCALIZATION =====
  'translate.content', 'manage.translations', 'create.language', 'update.language', 'delete.language',
  
  // ===== PROFILE & PERSONAL SETTINGS =====
  'read.own-profile', 'update.own-profile', 'change.own-password', 'manage.own-preferences',
  'read.own-timesheet', 'update.own-timesheet', 'submit.own-timesheet',
  'read.own-leave', 'request.own-leave', 'cancel.own-leave',
  
  // ===== EMPLOYEE DASHBOARD =====
  'read.employee-dashboard', 'customize.employee-dashboard', 'export.employee-data',
  
  // ===== SPECIAL OPERATIONS =====
  'bulk.operations', 'mass.update', 'mass.delete', 'mass.import', 'mass.export',
  'override.permissions', 'bypass.security', 'emergency.access',
  
  // ===== AUDIT & COMPLIANCE =====
  'audit.read-logs', 'audit.export-logs', 'audit.delete-logs', 'compliance.report',
  'gdpr.export-data', 'gdpr.delete-data', 'gdpr.anonymize-data',
  
  // ===== BACKUP & RECOVERY =====
  'backup.create', 'backup.restore', 'backup.download', 'backup.delete', 'backup.schedule',
  'recovery.initiate', 'recovery.monitor', 'recovery.rollback'
];

async function generateComprehensivePermissions() {
  try {
    console.log('🔧 Generating comprehensive permissions for entire application...\n');
    
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
    const missingPermissions = comprehensivePermissions.filter(perm => !currentPermissionNames.includes(perm));
    
    if (missingPermissions.length === 0) {
      console.log('✅ All comprehensive permissions are already present!');
      return;
    }
    
    console.log(`📋 Found ${missingPermissions.length} missing permissions out of ${comprehensivePermissions.length} total:`);
    console.log(`  - Current: ${currentPermissionNames.length}`);
    console.log(`  - Missing: ${missingPermissions.length}`);
    console.log(`  - Total needed: ${comprehensivePermissions.length}\n`);
    
    // Group missing permissions by category
    const groupedPermissions: Record<string, string[]> = {};
    missingPermissions.forEach(perm => {
      const category = perm.split('.')[1] || 'Other';
      if (!groupedPermissions[category]) {
        groupedPermissions[category] = [];
      }
      groupedPermissions[category].push(perm);
    });
    
    console.log('📂 Missing permissions by category:');
    Object.entries(groupedPermissions).forEach(([category, perms]) => {
      console.log(`  ${category}: ${perms.length} permissions`);
      perms.forEach(perm => console.log(`    - ${perm}`));
    });
    
    // Insert missing permissions
    console.log('\n🚀 Inserting missing permissions...');
    let successCount = 0;
    let errorCount = 0;
    
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
        successCount++;
      } catch (error) {
        console.log(`  ❌ Failed to create: ${permissionName} - ${error}`);
        errorCount++;
      }
    }
    
    console.log('\n🎉 Permission generation completed!');
    console.log(`  ✅ Successfully created: ${successCount} permissions`);
    console.log(`  ❌ Failed to create: ${errorCount} permissions`);
    
    // Show final count
    const finalPermissions = await db
      .select({
        id: permissionsTable.id,
        name: permissionsTable.name,
      })
      .from(permissionsTable);
    
    console.log(`\n📊 Final database status:`);
    console.log(`  - Total permissions in database: ${finalPermissions.length}`);
    console.log(`  - Coverage: ${((finalPermissions.length / comprehensivePermissions.length) * 100).toFixed(1)}%`);
    
    if (finalPermissions.length < comprehensivePermissions.length) {
      const stillMissing = comprehensivePermissions.filter(perm => 
        !finalPermissions.map(p => p.name).includes(perm)
      );
      console.log(`\n⚠️  Still missing ${stillMissing.length} permissions:`);
      stillMissing.forEach(perm => console.log(`  - ${perm}`));
    }
    
  } catch (error) {
    console.error('❌ Error generating comprehensive permissions:', error);
  } finally {
    process.exit(0);
  }
}

generateComprehensivePermissions();
