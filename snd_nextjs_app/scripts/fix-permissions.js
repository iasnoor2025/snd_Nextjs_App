const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:fAfab9Ckow7o3yp2EhryEYKzHbyeMifPBHxi8Xb4f9sdnBgMI47Ytdaq2NWDCxy5@192.168.8.4:5432/snd_nextjs_db'
});

async function fixPermissions() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Starting permission system fix...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // 1. Clear existing generic permissions
    console.log('🗑️ Clearing existing generic permissions...');
    await client.query('DELETE FROM role_has_permissions');
    await client.query('DELETE FROM model_has_permissions');
    await client.query('DELETE FROM permissions');
    
    // 2. Create proper subject-based permissions
    console.log('📝 Creating subject-based permissions...');
    const permissions = [
      // User permissions
      { name: 'read.User', guardName: 'web' },
      { name: 'create.User', guardName: 'web' },
      { name: 'update.User', guardName: 'web' },
      { name: 'delete.User', guardName: 'web' },
      { name: 'manage.User', guardName: 'web' },
      
      // Employee permissions
      { name: 'read.Employee', guardName: 'web' },
      { name: 'create.Employee', guardName: 'web' },
      { name: 'update.Employee', guardName: 'web' },
      { name: 'delete.Employee', guardName: 'web' },
      { name: 'manage.Employee', guardName: 'web' },
      
      // Equipment permissions
      { name: 'read.Equipment', guardName: 'web' },
      { name: 'create.Equipment', guardName: 'web' },
      { name: 'update.Equipment', guardName: 'web' },
      { name: 'delete.Equipment', guardName: 'web' },
      { name: 'manage.Equipment', guardName: 'web' },
      
      // Customer permissions
      { name: 'read.Customer', guardName: 'web' },
      { name: 'create.Customer', guardName: 'web' },
      { name: 'update.Customer', guardName: 'web' },
      { name: 'delete.Customer', guardName: 'web' },
      { name: 'manage.Customer', guardName: 'web' },
      
      // Rental permissions
      { name: 'read.Rental', guardName: 'web' },
      { name: 'create.Rental', guardName: 'web' },
      { name: 'update.Rental', guardName: 'web' },
      { name: 'delete.Rental', guardName: 'web' },
      { name: 'manage.Rental', guardName: 'web' },
      
      // Timesheet permissions
      { name: 'read.Timesheet', guardName: 'web' },
      { name: 'create.Timesheet', guardName: 'web' },
      { name: 'update.Timesheet', guardName: 'web' },
      { name: 'delete.Timesheet', guardName: 'web' },
      { name: 'manage.Timesheet', guardName: 'web' },
      { name: 'approve.Timesheet', guardName: 'web' },
      
      // Payroll permissions
      { name: 'read.Payroll', guardName: 'web' },
      { name: 'create.Payroll', guardName: 'web' },
      { name: 'update.Payroll', guardName: 'web' },
      { name: 'delete.Payroll', guardName: 'web' },
      { name: 'manage.Payroll', guardName: 'web' },
      
      // Project permissions
      { name: 'read.Project', guardName: 'web' },
      { name: 'create.Project', guardName: 'web' },
      { name: 'update.Project', guardName: 'web' },
      { name: 'delete.Project', guardName: 'web' },
      { name: 'manage.Project', guardName: 'web' },
      
      // Maintenance permissions
      { name: 'read.Maintenance', guardName: 'web' },
      { name: 'create.Maintenance', guardName: 'web' },
      { name: 'update.Maintenance', guardName: 'web' },
      { name: 'delete.Maintenance', guardName: 'web' },
      { name: 'manage.Maintenance', guardName: 'web' },
      
      // Location permissions
      { name: 'read.Location', guardName: 'web' },
      { name: 'create.Location', guardName: 'web' },
      { name: 'update.Location', guardName: 'web' },
      { name: 'delete.Location', guardName: 'web' },
      { name: 'manage.Location', guardName: 'web' },
      
      // Report permissions
      { name: 'read.Report', guardName: 'web' },
      { name: 'create.Report', guardName: 'web' },
      { name: 'update.Report', guardName: 'web' },
      { name: 'delete.Report', guardName: 'web' },
      { name: 'manage.Report', guardName: 'web' },
      
      // Leave permissions
      { name: 'read.Leave', guardName: 'web' },
      { name: 'create.Leave', guardName: 'web' },
      { name: 'update.Leave', guardName: 'web' },
      { name: 'delete.Leave', guardName: 'web' },
      { name: 'manage.Leave', guardName: 'web' },
      { name: 'approve.Leave', guardName: 'web' },
      
      // Advance permissions
      { name: 'read.Advance', guardName: 'web' },
      { name: 'create.Advance', guardName: 'web' },
      { name: 'update.Advance', guardName: 'web' },
      { name: 'delete.Advance', guardName: 'web' },
      { name: 'manage.Advance', guardName: 'web' },
      { name: 'approve.Advance', guardName: 'web' },
      
      // Assignment permissions
      { name: 'read.Assignment', guardName: 'web' },
      { name: 'create.Assignment', guardName: 'web' },
      { name: 'update.Assignment', guardName: 'web' },
      { name: 'delete.Assignment', guardName: 'web' },
      { name: 'manage.Assignment', guardName: 'web' },
      { name: 'approve.Assignment', guardName: 'web' },
      
      // Salary Increment permissions
      { name: 'read.SalaryIncrement', guardName: 'web' },
      { name: 'create.SalaryIncrement', guardName: 'web' },
      { name: 'update.SalaryIncrement', guardName: 'web' },
      { name: 'delete.SalaryIncrement', guardName: 'web' },
      { name: 'manage.SalaryIncrement', guardName: 'web' },
      { name: 'approve.SalaryIncrement', guardName: 'web' },
      
      // Wildcard permissions for super admin
      { name: '*', guardName: 'web' },
      { name: 'manage.all', guardName: 'web' },
    ];
    
    for (const permission of permissions) {
      await client.query(
        'INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE)',
        [permission.name, permission.guardName]
      );
    }
    
    console.log(`✅ Created ${permissions.length} permissions`);
    
    // 3. Get all permissions and roles
    const permissionsResult = await client.query('SELECT id, name FROM permissions ORDER BY id');
    const rolesResult = await client.query('SELECT id, name FROM roles ORDER BY id');
    
    const allPermissions = permissionsResult.rows;
    const allRoles = rolesResult.rows;
    
    console.log(`📋 Found ${allPermissions.length} permissions and ${allRoles.length} roles`);
    console.log('Available roles:', allRoles.map(r => `${r.id}:${r.name}`).join(', '));
    
    // 4. Assign all permissions to Admin role (role ID 1)
    console.log('🔐 Assigning all permissions to Admin role...');
    const adminRoleId = 1;
    
    for (const permission of allPermissions) {
      await client.query(
        'INSERT INTO role_has_permissions (role_id, permission_id) VALUES ($1, $2)',
        [adminRoleId, permission.id]
      );
    }
    
    console.log(`✅ Assigned ${allPermissions.length} permissions to Admin role`);
    
    // 5. Create role hierarchy and assign basic permissions to other roles
    console.log('🏗️ Setting up role hierarchy...');
    
    // Only assign permissions to roles that actually exist
    const existingRoleIds = allRoles.map(r => r.id);
    
    // Manager role (ID 3) - gets most permissions but not user management
    if (existingRoleIds.includes(3)) {
      const managerPermissions = allPermissions.filter(p => 
        !p.name.includes('User') && 
        !p.name.includes('SalaryIncrement') && 
        !p.name.includes('Payroll') &&
        p.name !== '*' &&
        p.name !== 'manage.all'
      );
      
      for (const permission of managerPermissions) {
        await client.query(
          'INSERT INTO role_has_permissions (role_id, permission_id) VALUES ($1, $2)',
          [3, permission.id]
        );
      }
      console.log(`✅ Assigned ${managerPermissions.length} permissions to Manager role`);
    }
    
    // Supervisor role (ID 4) - gets operational permissions
    if (existingRoleIds.includes(4)) {
      const supervisorPermissions = allPermissions.filter(p => 
        (p.name.includes('Employee') || p.name.includes('Timesheet') || p.name.includes('Equipment') || p.name.includes('Assignment')) &&
        !p.name.includes('delete') &&
        p.name !== '*' &&
        p.name !== 'manage.all'
      );
      
      for (const permission of supervisorPermissions) {
        await client.query(
          'INSERT INTO role_has_permissions (role_id, permission_id) VALUES ($1, $2)',
          [4, permission.id]
        );
      }
      console.log(`✅ Assigned ${supervisorPermissions.length} permissions to Supervisor role`);
    }
    
    // Operator role (ID 5) - gets basic operational permissions
    if (existingRoleIds.includes(5)) {
      const operatorPermissions = allPermissions.filter(p => 
        (p.name.includes('Equipment') || p.name.includes('Timesheet')) &&
        (p.name.includes('read') || p.name.includes('create') || p.name.includes('update')) &&
        p.name !== '*' &&
        p.name !== 'manage.all'
      );
      
      for (const permission of operatorPermissions) {
        await client.query(
          'INSERT INTO role_has_permissions (role_id, permission_id) VALUES ($1, $2)',
          [5, permission.id]
        );
      }
      console.log(`✅ Assigned ${operatorPermissions.length} permissions to Operator role`);
    }
    
    // Employee role (ID 6) - gets basic read permissions
    if (existingRoleIds.includes(6)) {
      const employeePermissions = allPermissions.filter(p => 
        p.name.includes('read') &&
        (p.name.includes('Employee') || p.name.includes('Timesheet') || p.name.includes('Equipment')) &&
        p.name !== '*' &&
        p.name !== 'manage.all'
      );
      
      for (const permission of employeePermissions) {
        await client.query(
          'INSERT INTO role_has_permissions (role_id, permission_id) VALUES ($1, $2)',
          [6, permission.id]
        );
      }
      console.log(`✅ Assigned ${employeePermissions.length} permissions to Employee role`);
    }
    
    // User role (ID 7) - gets minimal read permissions
    if (existingRoleIds.includes(7)) {
      const userPermissions = allPermissions.filter(p => 
        p.name.includes('read') &&
        (p.name.includes('Employee') || p.name.includes('Equipment')) &&
        p.name !== '*' &&
        p.name !== 'manage.all'
      );
      
      for (const permission of userPermissions) {
        await client.query(
          'INSERT INTO role_has_permissions (role_id, permission_id) VALUES ($1, $2)',
          [7, permission.id]
        );
      }
      console.log(`✅ Assigned ${userPermissions.length} permissions to User role`);
    }
    
    console.log('✅ Role hierarchy and permissions set up complete');
    
    // 6. Verify the Admin user has the Admin role properly assigned
    console.log('👤 Verifying Admin user role assignment...');
    
    // Check if user-role relationship exists
    const userRoleCheck = await client.query(
      'SELECT * FROM model_has_roles WHERE user_id = 1 AND role_id = 1'
    );
    
    if (userRoleCheck.rows.length === 0) {
      console.log('🔗 Creating user-role relationship for Admin user...');
      await client.query(
        'INSERT INTO model_has_roles (user_id, role_id) VALUES (1, 1)'
      );
    } else {
      console.log('✅ Admin user already has Admin role assigned');
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('🎉 Permission system fix completed successfully!');
    
    // 7. Display summary
    console.log('\n📊 Summary:');
    console.log(`- Created ${permissions.length} permissions`);
    console.log(`- Admin role (ID 1) has all permissions`);
    
    // Count permissions for each role
    for (const role of allRoles) {
      if (role.id !== 1) { // Skip admin role as it has all permissions
        const rolePermsResult = await client.query(
          'SELECT COUNT(*) as count FROM role_has_permissions WHERE role_id = $1',
          [role.id]
        );
        const count = rolePermsResult.rows[0].count;
        console.log(`- ${role.name} role (ID ${role.id}) has ${count} permissions`);
      }
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error fixing permissions:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the fix
fixPermissions()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
