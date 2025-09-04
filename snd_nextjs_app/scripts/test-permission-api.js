const { Pool } = require('pg');
require('dotenv').config();

async function testPermissionAPI() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🧪 Testing Permission API Logic...\n');

    // Get a sample user
    const userResult = await pool.query('SELECT id, name, email FROM users LIMIT 1');
    
    if (userResult.rows.length === 0) {
      console.log('❌ No users found in the database');
      return;
    }

    const user = userResult.rows[0];
    console.log(`👤 Testing for user: ${user.name} (ID: ${user.id})\n`);

    // Test the exact logic from server-dashboard-permissions.ts
    const dashboardSections = [
      { section: 'iqama', action: 'read', subject: 'Employee' },
      { section: 'iqamaManagement', action: 'manage', subject: 'Iqama' },
      { section: 'equipment', action: 'read', subject: 'Equipment' },
      { section: 'financial', action: 'read', subject: 'Payroll' },
      { section: 'timesheets', action: 'read', subject: 'Timesheet' },
      { section: 'projectOverview', action: 'read', subject: 'Project' },
      { section: 'quickActions', action: 'read', subject: 'Settings' },
      { section: 'recentActivity', action: 'read', subject: 'Settings' },
      { section: 'employeeAdvance', action: 'read', subject: 'AdvancePayment' },
      { section: 'myTeam', action: 'read', subject: 'Employee' }
    ];

    console.log('🔍 Testing each dashboard section permission:\n');

    for (const section of dashboardSections) {
      // Check if user has the required permission
      const permissionResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM permissions p
        JOIN role_has_permissions rhp ON p.id = rhp.permission_id
        JOIN roles r ON rhp.role_id = r.id
        JOIN model_has_roles mhr ON r.id = mhr.role_id
        WHERE mhr.user_id = $1 
        AND p.name = $2
      `, [user.id, `${section.action}.${section.subject}`]);

      const hasPermission = permissionResult.rows[0].count > 0;
      const status = hasPermission ? '✅ YES' : '❌ NO';
      
      console.log(`${section.section}: ${status} (requires ${section.action}.${section.subject})`);
    }

    console.log('\n📊 Expected Dashboard Sections:');
    const accessibleSections = [];
    for (const section of dashboardSections) {
      const permissionResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM permissions p
        JOIN role_has_permissions rhp ON p.id = rhp.permission_id
        JOIN roles r ON rhp.role_id = r.id
        JOIN model_has_roles mhr ON r.id = mhr.role_id
        WHERE mhr.user_id = $1 
        AND p.name = $2
      `, [user.id, `${section.action}.${section.subject}`]);

      const hasPermission = permissionResult.rows[0].count > 0;
      if (hasPermission) {
        accessibleSections.push(section.section);
      }
    }

    console.log('Should be visible:');
    if (accessibleSections.length === 0) {
      console.log('  ❌ No sections should be visible');
    } else {
      accessibleSections.forEach(section => console.log(`  ✅ ${section}`));
    }

    console.log('\nShould NOT be visible:');
    const nonAccessibleSections = dashboardSections
      .map(s => s.section)
      .filter(s => !accessibleSections.includes(s));
    
    if (nonAccessibleSections.length === 0) {
      console.log('  ✅ All sections should be visible');
    } else {
      nonAccessibleSections.forEach(section => console.log(`  ❌ ${section}`));
    }

  } catch (error) {
    console.error('❌ Error testing permission API:', error);
  } finally {
    await pool.end();
  }
}

testPermissionAPI();
