const { Pool } = require('pg');
require('dotenv').config();

async function checkSuperAdminDashboardPermissions() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Checking Super Admin Dashboard Permissions...\n');

    // Get super admin user
    const superAdminResult = await pool.query(`
      SELECT u.id, u.name, u.email
      FROM users u
      JOIN model_has_roles mhr ON u.id = mhr.user_id
      JOIN roles r ON mhr.role_id = r.id
      WHERE r.name = 'SUPER_ADMIN'
      LIMIT 1
    `);

    if (superAdminResult.rows.length === 0) {
      console.log('❌ No SUPER_ADMIN user found');
      return;
    }

    const superAdmin = superAdminResult.rows[0];
    console.log(`👤 Super Admin: ${superAdmin.name} (${superAdmin.email}) - ID: ${superAdmin.id}\n`);

    // Check all required dashboard permissions
    const dashboardPermissions = [
      { section: 'iqama', permission: 'read.Employee', description: 'Iqama Overview section' },
      { section: 'iqamaManagement', permission: 'manage.Iqama', description: 'Iqama Management section' },
      { section: 'equipment', permission: 'read.Equipment', description: 'Equipment section' },
      { section: 'financial', permission: 'read.Payroll', description: 'Financial section' },
      { section: 'timesheets', permission: 'read.Timesheet', description: 'Timesheets section' },
      { section: 'projectOverview', permission: 'read.Project', description: 'Project Overview section' },
      { section: 'quickActions', permission: 'read.Settings', description: 'Quick Actions section' },
      { section: 'recentActivity', permission: 'read.Settings', description: 'Recent Activity section' },
      { section: 'employeeAdvance', permission: 'read.AdvancePayment', description: 'Employee Advance section' },
      { section: 'myTeam', permission: 'read.Employee', description: 'My Team section' },
      { section: 'manualAssignments', permission: 'read.Employee', description: 'Manual Assignments section' }
    ];

    console.log('🎯 Dashboard Section Permissions Check:\n');
    
    const accessibleSections = [];
    const nonAccessibleSections = [];

    for (const item of dashboardPermissions) {
      const hasPermissionResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM permissions p
        JOIN role_has_permissions rhp ON p.id = rhp.permission_id
        JOIN roles r ON rhp.role_id = r.id
        JOIN model_has_roles mhr ON r.id = mhr.role_id
        WHERE mhr.user_id = $1 AND p.name = $2
      `, [superAdmin.id, item.permission]);

      const hasPermission = hasPermissionResult.rows[0].count > 0;
      const status = hasPermission ? '✅ YES' : '❌ NO';
      
      console.log(`${item.section}: ${status} (requires ${item.permission}) - ${item.description}`);
      
      if (hasPermission) {
        accessibleSections.push(item.section);
      } else {
        nonAccessibleSections.push(item.section);
      }
    }

    console.log('\n📊 Summary:');
    console.log('✅ Should be visible:');
    if (accessibleSections.length === 0) {
      console.log('  ❌ No sections should be visible');
    } else {
      accessibleSections.forEach(section => console.log(`  - ${section}`));
    }

    console.log('\n❌ Should NOT be visible:');
    if (nonAccessibleSections.length === 0) {
      console.log('  ✅ All sections should be visible');
    } else {
      nonAccessibleSections.forEach(section => console.log(`  - ${section}`));
    }

    // Test the API endpoint for this user
    console.log('\n🧪 Testing API Endpoint:');
    console.log(`API URL: http://localhost:3000/api/permissions/sections/${superAdmin.id}`);
    console.log('Expected sections:', accessibleSections);

  } catch (error) {
    console.error('❌ Error checking super admin permissions:', error);
  } finally {
    await pool.end();
  }
}

checkSuperAdminDashboardPermissions();
