const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config();

// Database connection
const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);
const db = drizzle(sql);

// Database-level timesheet stage permissions to add (these match the permission mappings)
const TIMESHEET_DB_PERMISSIONS = [
  'approve.timesheet.foreman',
  'approve.timesheet.incharge', 
  'approve.timesheet.checking',
  'approve.timesheet.manager',
];

async function addTimesheetDbPermissions() {
  try {
    console.log('🔍 Starting to add database-level timesheet stage permissions...');
    
    // Get existing permissions from the database
    const existingPermissions = await sql`
      SELECT name FROM permissions 
      ORDER BY name
    `;
    
    const existingPermissionNames = existingPermissions.map(p => p.name);
    console.log(`📊 Found ${existingPermissionNames.length} existing permissions in database`);
    
    // Find permissions that need to be added
    const permissionsToAdd = TIMESHEET_DB_PERMISSIONS.filter(name => !existingPermissionNames.includes(name));
    
    console.log(`➕ Found ${permissionsToAdd.length} database-level timesheet stage permissions to add:`);
    permissionsToAdd.forEach(p => console.log(`   - ${p}`));
    
    if (permissionsToAdd.length === 0) {
      console.log('✅ All database-level timesheet stage permissions already exist!');
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
    
    console.log(`✅ Successfully added ${permissionsToAdd.length} database-level timesheet stage permissions!`);
    
    // Show final permission count
    const finalPermissions = await sql`
      SELECT name FROM permissions 
      WHERE name LIKE 'approve.timesheet.%'
      ORDER BY name
    `;
    
    console.log(`📊 Database-level timesheet stage permissions:`);
    finalPermissions.forEach(p => console.log(`   - ${p.name}`));
    
  } catch (error) {
    console.error('❌ Error adding database-level timesheet stage permissions:', error);
  } finally {
    await sql.end();
  }
}

// Run the script
addTimesheetDbPermissions();
