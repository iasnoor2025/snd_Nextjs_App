const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config();

// Database connection
const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);
const db = drizzle(sql);

// Missing permissions that need to be added
const MISSING_PERMISSIONS = [
  // Timesheet approval permissions
  'approve.Timesheet',
  'reject.Timesheet',
  
  // All other permissions from PermissionConfigs
  'read.User', 'create.User', 'update.User', 'delete.User', 'manage.User',
  'read.Employee', 'create.Employee', 'update.Employee', 'delete.Employee', 'manage.Employee',
  'read.Customer', 'create.Customer', 'update.Customer', 'delete.Customer', 'manage.Customer',
  'read.Equipment', 'create.Equipment', 'update.Equipment', 'delete.Equipment', 'manage.Equipment', 'sync.Equipment',
  'read.Project', 'create.Project', 'update.Project', 'delete.Project', 'manage.Project',
  'read.Rental', 'create.Rental', 'update.Rental', 'delete.Rental', 'manage.Rental',
  'read.Quotation', 'create.Quotation', 'update.Quotation', 'delete.Quotation', 'manage.Quotation',
  'read.Payroll', 'create.Payroll', 'update.Payroll', 'delete.Payroll', 'manage.Payroll',
  'read.Timesheet', 'create.Timesheet', 'update.Timesheet', 'delete.Timesheet', 'manage.Timesheet',
  'read.Leave', 'create.Leave', 'update.Leave', 'delete.Leave', 'manage.Leave', 'approve.Leave', 'reject.Leave',
  'read.Department', 'create.Department', 'update.Department', 'delete.Department', 'manage.Department',
  'read.Designation', 'create.Designation', 'update.Designation', 'delete.Designation', 'manage.Designation',
  'read.Company', 'create.Company', 'update.Company', 'delete.Company', 'manage.Company',
  'read.Settings', 'create.Settings', 'update.Settings', 'delete.Settings', 'manage.Settings',
  'read.Location', 'create.Location', 'update.Location', 'delete.Location', 'manage.Location',
  'read.Maintenance', 'create.Maintenance', 'update.Maintenance', 'delete.Maintenance', 'manage.Maintenance',
  'read.Safety', 'create.Safety', 'update.Safety', 'delete.Safety', 'manage.Safety',
  'read.SalaryIncrement', 'create.SalaryIncrement', 'update.SalaryIncrement', 'delete.SalaryIncrement', 'manage.SalaryIncrement', 'approve.SalaryIncrement', 'reject.SalaryIncrement', 'apply.SalaryIncrement',
  'read.Advance', 'create.Advance', 'update.Advance', 'delete.Advance', 'manage.Advance',
  'read.PettyCash', 'create.PettyCash', 'update.PettyCash', 'delete.PettyCash', 'manage.PettyCash',
  'read.Assignment', 'create.Assignment', 'update.Assignment', 'delete.Assignment', 'manage.Assignment',
  'read.Report', 'create.Report', 'update.Report', 'delete.Report', 'manage.Report', 'export.Report',
  'read.Document', 'create.Document', 'update.Document', 'delete.Document', 'manage.Document', 'upload.Document', 'download.Document',
  'read.Dashboard', 'create.Dashboard', 'update.Dashboard', 'delete.Dashboard', 'manage.Dashboard',
  'read.Admin', 'create.Admin', 'update.Admin', 'delete.Admin', 'manage.Admin',
];

async function addMissingPermissions() {
  try {
    console.log('🔍 Starting to add missing permissions...');
    
    // Get existing permissions from the database
    const existingPermissions = await sql`
      SELECT name FROM permissions 
      ORDER BY name
    `;
    
    const existingPermissionNames = existingPermissions.map(p => p.name);
    console.log(`📊 Found ${existingPermissionNames.length} existing permissions in database`);
    
    // Find permissions that need to be added
    const permissionsToAdd = MISSING_PERMISSIONS.filter(name => !existingPermissionNames.includes(name));
    
    console.log(`➕ Found ${permissionsToAdd.length} permissions to add:`);
    permissionsToAdd.forEach(p => console.log(`   - ${p}`));
    
    if (permissionsToAdd.length === 0) {
      console.log('✅ All permissions already exist!');
      return;
    }
    
    // Add missing permissions
    for (const permission of permissionsToAdd) {
      console.log(`➕ Adding ${permission}...`);
      await sql`
        INSERT INTO permissions (name, guard_name, created_at, updated_at)
        VALUES (${permission}, 'web', NOW(), NOW())
      `;
    }
    
    console.log(`✅ Successfully added ${permissionsToAdd.length} missing permissions!`);
    
    // Show final permission count
    const finalPermissions = await sql`
      SELECT name FROM permissions 
      ORDER BY name
    `;
    
    console.log(`📊 Final permission count: ${finalPermissions.length}`);
    
  } catch (error) {
    console.error('❌ Error adding missing permissions:', error);
  } finally {
    await sql.end();
  }
}

// Run the script
addMissingPermissions();
