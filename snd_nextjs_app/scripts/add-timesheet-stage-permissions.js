const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config();

// Database connection
const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);
const db = drizzle(sql);

// Timesheet stage-specific permissions to add
const TIMESHEET_STAGE_PERMISSIONS = [
  'approve.Timesheet.Foreman',
  'approve.Timesheet.Incharge', 
  'approve.Timesheet.Checking',
  'approve.Timesheet.Manager',
];

async function addTimesheetStagePermissions() {
  try {
    console.log('🔍 Starting to add timesheet stage-specific permissions...');
    
    // Get existing permissions from the database
    const existingPermissions = await sql`
      SELECT name FROM permissions 
      ORDER BY name
    `;
    
    const existingPermissionNames = existingPermissions.map(p => p.name);
    console.log(`📊 Found ${existingPermissionNames.length} existing permissions in database`);
    
    // Find permissions that need to be added
    const permissionsToAdd = TIMESHEET_STAGE_PERMISSIONS.filter(name => !existingPermissionNames.includes(name));
    
    console.log(`➕ Found ${permissionsToAdd.length} timesheet stage permissions to add:`);
    permissionsToAdd.forEach(p => console.log(`   - ${p}`));
    
    if (permissionsToAdd.length === 0) {
      console.log('✅ All timesheet stage permissions already exist!');
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
    
    console.log(`✅ Successfully added ${permissionsToAdd.length} timesheet stage permissions!`);
    
    // Show final permission count
    const finalPermissions = await sql`
      SELECT name FROM permissions 
      WHERE name LIKE 'approve.Timesheet.%'
      ORDER BY name
    `;
    
    console.log(`📊 Timesheet stage permissions in database:`);
    finalPermissions.forEach(p => console.log(`   - ${p.name}`));
    
  } catch (error) {
    console.error('❌ Error adding timesheet stage permissions:', error);
  } finally {
    await sql.end();
  }
}

// Run the script
addTimesheetStagePermissions();
