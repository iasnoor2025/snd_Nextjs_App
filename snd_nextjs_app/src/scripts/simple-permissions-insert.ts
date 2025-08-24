import { config } from 'dotenv';
import { resolve } from 'path';
import { pool } from '../lib/drizzle';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../../.env.local') });

async function insertPermissions() {
  try {
    console.log('🔧 Inserting permissions directly...\n');
    
    // Define permissions array
    const permissions = [
      // Core system permissions
      'manage.all', '*', 'sync.all', 'reset.all',
      
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
      'create.equipment-document', 'read.equipment-document', 'update.equipment-document', 'delete.equipment-document', 'manage.equipment-document',
      'create.equipment-maintenance', 'read.equipment-maintenance', 'update.equipment-maintenance', 'delete.equipment-maintenance', 'manage.equipment-maintenance',
      'create.equipment-rental', 'read.equipment-rental', 'update.equipment-rental', 'delete.equipment-rental', 'manage.equipment-rental',
      
      // Project management
      'create.Project', 'read.Project', 'update.Project', 'delete.Project', 'manage.Project',
      'create.project-resource', 'read.project-resource', 'update.project-resource', 'delete.project-resource', 'manage.project-resource',
      'create.project-task', 'read.project-task', 'update.project-task', 'delete.project-task', 'manage.project-task',
      'create.project-milestone', 'read.project-milestone', 'update.project-milestone', 'delete.project-milestone', 'manage.project-milestone',
      
      // Timesheet management
      'create.Timesheet', 'read.Timesheet', 'update.Timesheet', 'delete.Timesheet', 'manage.Timesheet',
      'create.timesheet-approval', 'read.timesheet-approval', 'update.timesheet-approval', 'delete.timesheet-approval', 'manage.timesheet-approval',
      'create.timesheet-generation', 'read.timesheet-generation', 'update.timesheet-generation', 'delete.timesheet-generation', 'manage.timesheet-generation',
      
      // Payroll management
      'create.Payroll', 'read.Payroll', 'update.Payroll', 'delete.Payroll', 'manage.Payroll',
      'create.payroll-calculation', 'read.payroll-calculation', 'update.payroll-calculation', 'delete.payroll-calculation', 'manage.payroll-calculation',
      'create.payroll-approval', 'read.payroll-approval', 'update.payroll-approval', 'delete.payroll-approval', 'manage.payroll-approval',
      
      // Company management
      'create.Company', 'read.Company', 'update.Company', 'delete.Company', 'manage.Company',
      'create.company-document', 'read.company-document', 'update.company-document', 'delete.company-document', 'manage.company-document',
      'create.company-setting', 'read.company-setting', 'update.company-setting', 'delete.company-setting', 'manage.company-setting',
      
      // Location management
      'create.Location', 'read.Location', 'update.Location', 'delete.Location', 'manage.Location',
      
      // Department management
      'create.Department', 'read.Department', 'update.Department', 'delete.Department', 'manage.Department',
      
      // Designation management
      'create.Designation', 'read.Designation', 'update.Designation', 'delete.Designation', 'manage.Designation',
      
      // Skills management
      'create.Skill', 'read.Skill', 'update.Skill', 'delete.Skill', 'manage.Skill',
      
      // Training management
      'create.Training', 'read.Training', 'update.Training', 'delete.Training', 'manage.Training',
      
      // Leave management
      'create.LeaveRequest', 'read.LeaveRequest', 'update.LeaveRequest', 'delete.LeaveRequest', 'manage.LeaveRequest',
      'create.leave-approval', 'read.leave-approval', 'update.leave-approval', 'delete.leave-approval', 'manage.leave-approval',
      
      // Performance management
      'create.PerformanceReview', 'read.PerformanceReview', 'update.PerformanceReview', 'delete.PerformanceReview', 'manage.PerformanceReview',
      
      // Safety management
      'create.SafetyIncident', 'read.SafetyIncident', 'update.SafetyIncident', 'delete.SafetyIncident', 'manage.SafetyIncident',
      
      // Maintenance management
      'create.Maintenance', 'read.Maintenance', 'update.Maintenance', 'delete.Maintenance', 'manage.Maintenance',
      
      // Rental management
      'create.Rental', 'read.Rental', 'update.Rental', 'delete.Rental', 'manage.Rental',
      'create.rental-item', 'read.rental-item', 'update.rental-item', 'delete.rental-item', 'manage.rental-item',
      
      // Quotation management
      'create.Quotation', 'read.Quotation', 'update.Quotation', 'delete.Quotation', 'manage.Quotation',
      
      // Analytics and reporting
      'view.analytics', 'export.analytics', 'view.reports', 'export.reports',
      
      // Notifications
      'create.Notification', 'read.Notification', 'update.Notification', 'delete.Notification', 'manage.Notification',
      
      // Settings
      'view.settings', 'update.settings', 'manage.settings',
      
      // Dashboard access
      'view.dashboard', 'view.employee-dashboard', 'view.admin-dashboard'
    ];
    
    console.log(`📋 Inserting ${permissions.length} permissions...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const permission of permissions) {
      try {
        await pool.query(
          'INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())',
          [permission, 'web']
        );
        successCount++;
        
        if (successCount % 50 === 0) {
          console.log(`  ✅ Inserted ${successCount} permissions...`);
        }
      } catch (error: unknown) {
        const dbError = error as { code?: string; message?: string };
        if (dbError.code === '23505') { // Unique constraint violation
          console.log(`  ⚠️ Permission '${permission}' already exists, skipping...`);
        } else {
          console.error(`  ❌ Error inserting '${permission}':`, dbError.message || 'Unknown error');
          errorCount++;
        }
      }
    }
    
    console.log(`\n📊 Insertion Summary:`);
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    
    // Verify final count
    const finalCount = await pool.query('SELECT COUNT(*) as count FROM permissions');
    console.log(`\n📊 Final permissions count: ${finalCount.rows[0]?.count || 0}`);
    
    if (finalCount.rows[0]?.count > 0) {
      console.log('🎉 Permissions successfully inserted!');
    } else {
      console.log('⚠️ No permissions were inserted. Check the database connection.');
    }
    
  } catch (error) {
    console.error('❌ Error inserting permissions:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

insertPermissions();
