import { config } from 'dotenv';
import { resolve } from 'path';
import { pool } from '../lib/drizzle';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../../.env.local') });

async function addMissingPermissions() {
  try {
    console.log('🔧 Adding missing permissions...\n');
    
    // Define missing permissions that the API needs
    const missingPermissions = [
      'read.Settings',
      'create.Settings',
      'update.Settings',
      'delete.Settings',
      'manage.Settings',
      'read.Report',
      'create.Report',
      'update.Report',
      'delete.Report',
      'manage.Report',
      'read.Safety',
      'create.Safety',
      'update.Safety',
      'delete.Safety',
      'manage.Safety',
      'read.SalaryIncrement',
      'create.SalaryIncrement',
      'update.SalaryIncrement',
      'delete.SalaryIncrement',
      'manage.SalaryIncrement',
      'read.Advance',
      'create.Advance',
      'update.Advance',
      'delete.Advance',
      'manage.Advance',
      'read.Assignment',
      'create.Assignment',
      'update.Assignment',
      'delete.Assignment',
      'manage.Assignment',
      'read.Document',
      'create.Document',
      'update.Document',
      'delete.Document',
      'manage.Document',
      'read.Analytics',
      'create.Analytics',
      'update.Analytics',
      'delete.Analytics',
      'manage.Analytics',
      'read.Dashboard',
      'create.Dashboard',
      'update.Dashboard',
      'delete.Dashboard',
      'manage.Dashboard',
      'read.webhook',
      'create.webhook',
      'update.webhook',
      'delete.webhook',
      'manage.webhook',
      'read.integration',
      'create.integration',
      'update.integration',
      'delete.integration',
      'manage.integration',
      'read.cron-job',
      'create.cron-job',
      'update.cron-job',
      'delete.cron-job',
      'manage.cron-job',
      'read.scheduled-task',
      'create.scheduled-task',
      'update.scheduled-task',
      'delete.scheduled-task',
      'manage.scheduled-task',
      'read.backup',
      'create.backup',
      'update.backup',
      'delete.backup',
      'manage.backup',
      'read.recovery',
      'create.recovery',
      'update.recovery',
      'delete.recovery',
      'manage.recovery',
      'read.audit',
      'create.audit',
      'update.audit',
      'delete.audit',
      'manage.audit',
      'read.compliance',
      'create.compliance',
      'update.compliance',
      'delete.compliance',
      'manage.compliance',
      'read.gdpr',
      'create.gdpr',
      'update.gdpr',
      'delete.gdpr',
      'manage.gdpr',
      'admin.system-health',
      'admin.performance-monitor',
      'admin.log-viewer',
      'admin.cache-manager',
      'admin.user-sessions',
      'admin.audit-logs',
      'admin.system-settings',
      'erp.sync-customers',
      'erp.sync-employees',
      'erp.sync-projects',
      'erp.sync-inventory',
      'erp.export-data',
      'erp.import-data',
      'erp.validate-connection',
      'read.own-profile',
      'update.own-profile',
      'change.own-password',
      'manage.own-preferences',
      'read.own-timesheet',
      'update.own-timesheet',
      'submit.own-timesheet',
      'read.own-leave',
      'request.own-leave',
      'cancel.own-leave',
      'read.employee-dashboard',
      'customize.employee-dashboard',
      'export.employee-data',
      'read.Leave',
      'create.Leave',
      'update.Leave',
      'delete.Leave',
      'manage.Leave'
    ];
    
    console.log(`📋 Adding ${missingPermissions.length} missing permissions...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const permission of missingPermissions) {
      try {
        await pool.query(
          'INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())',
          [permission, 'web']
        );
        successCount++;
        
        if (successCount % 20 === 0) {
          console.log(`  ✅ Added ${successCount} permissions...`);
        }
      } catch (error: unknown) {
        const dbError = error as { code?: string; message?: string };
        if (dbError.code === '23505') { // Unique constraint violation
          console.log(`  ⚠️ Permission '${permission}' already exists, skipping...`);
        } else {
          console.error(`  ❌ Error adding '${permission}':`, dbError.message || 'Unknown error');
          errorCount++;
        }
      }
    }
    
    console.log(`\n📊 Addition Summary:`);
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    
    // Verify final count
    const finalCount = await pool.query('SELECT COUNT(*) as count FROM permissions');
    console.log(`\n📊 Final permissions count: ${finalCount.rows[0]?.count || 0}`);
    
    if (finalCount.rows[0]?.count > 0) {
      console.log('🎉 Missing permissions successfully added!');
    } else {
      console.log('⚠️ No permissions were added. Check the database connection.');
    }
    
  } catch (error) {
    console.error('❌ Error adding missing permissions:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

addMissingPermissions();
