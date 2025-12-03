const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/database';
const sql = postgres(connectionString);
const db = drizzle(sql);

async function fixHRSpecialistPermissions() {
  try {
    console.log('🔧 Fixing HR_SPECIALIST permissions...');
    
    // First, let's check if the HR_SPECIALIST role exists
    const roleCheck = await sql`SELECT id, name FROM roles WHERE name = 'HR_SPECIALIST'`;
    
    if (roleCheck.length === 0) {
      console.log('❌ HR_SPECIALIST role not found. Creating it...');
      
      // Create the HR_SPECIALIST role
      const [newRole] = await sql`
        INSERT INTO roles (name, guard_name, created_at, updated_at)
        VALUES ('HR_SPECIALIST', 'web', NOW(), NOW())
        RETURNING id, name
      `;
      
      console.log(`✅ Created HR_SPECIALIST role with ID: ${newRole.id}`);
    } else {
      console.log(`✅ HR_SPECIALIST role exists with ID: ${roleCheck[0].id}`);
    }
    
    const roleId = roleCheck.length > 0 ? roleCheck[0].id : newRole.id;
    
    // Define the permissions that HR_SPECIALIST should have
    const hrPermissions = [
      'read.Employee',
      'read.Leave', 
      'read.performance-review',
      'read.Training',
      'read.Report',
      'read.User',
      'read.Dashboard',
      'read.Department',
      'read.Designation',
      'read.Company',
      'read.Settings',
      'read.employee-document',
      'read.SalaryIncrement',
      'read.Advance',
      'read.Assignment',
      'read.Location',
      'read.Maintenance',
      'read.Safety',
      'read.Project',
      'read.Timesheet',
      'read.Customer',
      'read.Equipment',
      'read.Rental',
      'read.Quotation',
      'read.Payroll'
    ];
    
    console.log(`🔍 Checking and creating ${hrPermissions.length} permissions...`);
    
    // Check and create permissions if they don't exist
    for (const permissionName of hrPermissions) {
      const permCheck = await sql`SELECT id FROM permissions WHERE name = ${permissionName}`;
      
      if (permCheck.length === 0) {
        console.log(`📝 Creating permission: ${permissionName}`);
        await sql`
          INSERT INTO permissions (name, guard_name, created_at, updated_at)
          VALUES (${permissionName}, 'web', NOW(), NOW())
        `;
      } else {
        console.log(`✅ Permission exists: ${permissionName}`);
      }
    }
    
    // Now assign all permissions to the HR_SPECIALIST role
    console.log('🔗 Assigning permissions to HR_SPECIALIST role...');
    
    // Clear existing permissions for this role
    await sql`DELETE FROM role_has_permissions WHERE role_id = ${roleId}`;
    
    // Get all permission IDs
    const permissionIds = await sql`
      SELECT id FROM permissions 
      WHERE name = ANY(${hrPermissions})
    `;
    
    // Assign permissions to role
    for (const perm of permissionIds) {
      await sql`
        INSERT INTO role_has_permissions (role_id, permission_id)
        VALUES (${roleId}, ${perm.id})
      `;
    }
    
    console.log(`✅ Assigned ${permissionIds.length} permissions to HR_SPECIALIST role`);
    
    // Verify the setup
    const finalCheck = await sql`
      SELECT p.name 
      FROM role_has_permissions rhp
      JOIN permissions p ON rhp.permission_id = p.id
      WHERE rhp.role_id = ${roleId}
      ORDER BY p.name
    `;
    
    console.log('\n📋 Final HR_SPECIALIST permissions:');
    finalCheck.forEach(perm => console.log(`  - ${perm.name}`));
    
    console.log('\n🎉 HR_SPECIALIST permissions fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing HR_SPECIALIST permissions:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the fix
if (require.main === module) {
  fixHRSpecialistPermissions()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixHRSpecialistPermissions };
