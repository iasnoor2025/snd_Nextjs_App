const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:fAfab9Ckow7o3yp2EhryEYKzHbyeMifPBHxi8Xb4f9sdnBgMI47Ytdaq2NWDCxy5@192.168.8.4:5432/snd_nextjs_db'
});

async function createComprehensiveRoles() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating comprehensive role system...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // 1. Clear existing roles and permissions
    console.log('🗑️ Clearing existing roles and permissions...');
    await client.query('DELETE FROM role_has_permissions');
    await client.query('DELETE FROM model_has_roles');
    await client.query('DELETE FROM permissions');
    await client.query('DELETE FROM roles');
    
    // 2. Create comprehensive role hierarchy
    console.log('👑 Creating comprehensive role hierarchy...');
    const roles = [
      { id: 1, name: 'SUPER_ADMIN', guardName: 'web', description: 'Full system access and control' },
      { id: 2, name: 'ADMIN', guardName: 'web', description: 'System administration and management' },
      { id: 3, name: 'GENERAL_MANAGER', guardName: 'web', description: 'Overall business management' },
      { id: 4, name: 'HR_MANAGER', guardName: 'web', description: 'Human resources management' },
      { id: 5, name: 'FINANCE_MANAGER', guardName: 'web', description: 'Financial operations management' },
      { id: 6, name: 'OPERATIONS_MANAGER', guardName: 'web', description: 'Operations and logistics management' },
      { id: 7, name: 'PROJECT_MANAGER', guardName: 'web', description: 'Project management and coordination' },
      { id: 8, name: 'SALES_MANAGER', guardName: 'web', description: 'Sales and customer management' },
      { id: 9, name: 'SUPERVISOR', guardName: 'web', description: 'Team supervision and oversight' },
      { id: 10, name: 'SENIOR_EMPLOYEE', guardName: 'web', description: 'Experienced employee with extended access' },
      { id: 11, name: 'EMPLOYEE', guardName: 'web', description: 'Standard employee access' },
      { id: 12, name: 'CONTRACTOR', guardName: 'web', description: 'Contractor with limited access' },
      { id: 13, name: 'VIEWER', guardName: 'web', description: 'Read-only access for reporting' },
      { id: 14, name: 'GUEST', guardName: 'web', description: 'Minimal access for visitors' },
    ];
    
    for (const role of roles) {
      await client.query(
        'INSERT INTO roles (id, name, guard_name, created_at, updated_at) VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE)',
        [role.id, role.name, role.guardName]
      );
    }
    
    console.log(`✅ Created ${roles.length} roles`);
    
    // 3. Create comprehensive permissions for all modules
    console.log('📝 Creating comprehensive permissions...');
    const permissions = [
      // User Management
      { name: 'read.User', guardName: 'web' },
      { name: 'create.User', guardName: 'web' },
      { name: 'update.User', guardName: 'web' },
      { name: 'delete.User', guardName: 'web' },
      { name: 'manage.User', guardName: 'web' },
      
      // Employee Management
      { name: 'read.Employee', guardName: 'web' },
      { name: 'create.Employee', guardName: 'web' },
      { name: 'update.Employee', guardName: 'web' },
      { name: 'delete.Employee', guardName: 'web' },
      { name: 'manage.Employee', guardName: 'web' },
      { name: 'approve.Employee', guardName: 'web' },
      
      // Company Management
      { name: 'read.Company', guardName: 'web' },
      { name: 'create.Company', guardName: 'web' },
      { name: 'update.Company', guardName: 'web' },
      { name: 'delete.Company', guardName: 'web' },
      { name: 'manage.Company', guardName: 'web' },
      
      // Customer Management
      { name: 'read.Customer', guardName: 'web' },
      { name: 'create.Customer', guardName: 'web' },
      { name: 'update.Customer', guardName: 'web' },
      { name: 'delete.Customer', guardName: 'web' },
      { name: 'manage.Customer', guardName: 'web' },
      
      // Equipment Management
      { name: 'read.Equipment', guardName: 'web' },
      { name: 'create.Equipment', guardName: 'web' },
      { name: 'update.Equipment', guardName: 'web' },
      { name: 'delete.Equipment', guardName: 'web' },
      { name: 'manage.Equipment', guardName: 'web' },
      { name: 'assign.Equipment', guardName: 'web' },
      
      // Maintenance Management
      { name: 'read.Maintenance', guardName: 'web' },
      { name: 'create.Maintenance', guardName: 'web' },
      { name: 'update.Maintenance', guardName: 'web' },
      { name: 'delete.Maintenance', guardName: 'web' },
      { name: 'manage.Maintenance', guardName: 'web' },
      { name: 'schedule.Maintenance', guardName: 'web' },
      
      // Rental Management
      { name: 'read.Rental', guardName: 'web' },
      { name: 'create.Rental', guardName: 'web' },
      { name: 'update.Rental', guardName: 'web' },
      { name: 'delete.Rental', guardName: 'web' },
      { name: 'manage.Rental', guardName: 'web' },
      { name: 'approve.Rental', guardName: 'web' },
      
      // Project Management
      { name: 'read.Project', guardName: 'web' },
      { name: 'create.Project', guardName: 'web' },
      { name: 'update.Project', guardName: 'web' },
      { name: 'delete.Project', guardName: 'web' },
      { name: 'manage.Project', guardName: 'web' },
      { name: 'assign.Project', guardName: 'web' },
      
      // Timesheet Management
      { name: 'read.Timesheet', guardName: 'web' },
      { name: 'create.Timesheet', guardName: 'web' },
      { name: 'update.Timesheet', guardName: 'web' },
      { name: 'delete.Timesheet', guardName: 'web' },
      { name: 'manage.Timesheet', guardName: 'web' },
      { name: 'approve.Timesheet', guardName: 'web' },
      { name: 'auto-generate.Timesheet', guardName: 'web' },
      
      // Leave Management
      { name: 'read.Leave', guardName: 'web' },
      { name: 'create.Leave', guardName: 'web' },
      { name: 'update.Leave', guardName: 'web' },
      { name: 'delete.Leave', guardName: 'web' },
      { name: 'manage.Leave', guardName: 'web' },
      { name: 'approve.Leave', guardName: 'web' },
      
      // Payroll Management
      { name: 'read.Payroll', guardName: 'web' },
      { name: 'create.Payroll', guardName: 'web' },
      { name: 'update.Payroll', guardName: 'web' },
      { name: 'delete.Payroll', guardName: 'web' },
      { name: 'manage.Payroll', guardName: 'web' },
      { name: 'process.Payroll', guardName: 'web' },
      { name: 'approve.Payroll', guardName: 'web' },
      
      // Salary Increments
      { name: 'read.SalaryIncrement', guardName: 'web' },
      { name: 'create.SalaryIncrement', guardName: 'web' },
      { name: 'update.SalaryIncrement', guardName: 'web' },
      { name: 'delete.SalaryIncrement', guardName: 'web' },
      { name: 'manage.SalaryIncrement', guardName: 'web' },
      { name: 'approve.SalaryIncrement', guardName: 'web' },
      
      // Document Management
      { name: 'read.Document', guardName: 'web' },
      { name: 'create.Document', guardName: 'web' },
      { name: 'update.Document', guardName: 'web' },
      { name: 'delete.Document', guardName: 'web' },
      { name: 'manage.Document', guardName: 'web' },
      { name: 'upload.Document', guardName: 'web' },
      
      // Location Management
      { name: 'read.Location', guardName: 'web' },
      { name: 'create.Location', guardName: 'web' },
      { name: 'update.Location', guardName: 'web' },
      { name: 'delete.Location', guardName: 'web' },
      { name: 'manage.Location', guardName: 'web' },
      
      // Quotation Management
      { name: 'read.Quotation', guardName: 'web' },
      { name: 'create.Quotation', guardName: 'web' },
      { name: 'update.Quotation', guardName: 'web' },
      { name: 'delete.Quotation', guardName: 'web' },
      { name: 'manage.Quotation', guardName: 'web' },
      { name: 'approve.Quotation', guardName: 'web' },
      
      // Analytics & Reporting
      { name: 'read.Analytics', guardName: 'web' },
      { name: 'create.Analytics', guardName: 'web' },
      { name: 'update.Analytics', guardName: 'web' },
      { name: 'delete.Analytics', guardName: 'web' },
      { name: 'manage.Analytics', guardName: 'web' },
      { name: 'export.Analytics', guardName: 'web' },
      
      // Safety Management
      { name: 'read.Safety', guardName: 'web' },
      { name: 'create.Safety', guardName: 'web' },
      { name: 'update.Safety', guardName: 'web' },
      { name: 'delete.Safety', guardName: 'web' },
      { name: 'manage.Safety', guardName: 'web' },
      { name: 'report.Safety', guardName: 'web' },
      
      // Notifications
      { name: 'read.Notification', guardName: 'web' },
      { name: 'create.Notification', guardName: 'web' },
      { name: 'update.Notification', guardName: 'web' },
      { name: 'delete.Notification', guardName: 'web' },
      { name: 'manage.Notification', guardName: 'web' },
      { name: 'send.Notification', guardName: 'web' },
      
      // Settings
      { name: 'read.Settings', guardName: 'web' },
      { name: 'create.Settings', guardName: 'web' },
      { name: 'update.Settings', guardName: 'web' },
      { name: 'delete.Settings', guardName: 'web' },
      { name: 'manage.Settings', guardName: 'web' },
      
      // Assignment Management
      { name: 'read.Assignment', guardName: 'web' },
      { name: 'create.Assignment', guardName: 'web' },
      { name: 'update.Assignment', guardName: 'web' },
      { name: 'delete.Assignment', guardName: 'web' },
      { name: 'manage.Assignment', guardName: 'web' },
      { name: 'approve.Assignment', guardName: 'web' },
      
      // Advance Management
      { name: 'read.Advance', guardName: 'web' },
      { name: 'create.Advance', guardName: 'web' },
      { name: 'update.Advance', guardName: 'web' },
      { name: 'delete.Advance', guardName: 'web' },
      { name: 'manage.Advance', guardName: 'web' },
      { name: 'approve.Advance', guardName: 'web' },
      
      // Wildcard permissions for super admin
      { name: '*', guardName: 'web' },
      { name: 'manage.all', guardName: 'web' },
      { name: 'access.all', guardName: 'web' },
    ];
    
    for (const permission of permissions) {
      await client.query(
        'INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE)',
        [permission.name, permission.guardName]
      );
    }
    
    console.log(`✅ Created ${permissions.length} permissions`);
    
    // 4. Get all permissions and roles
    const permissionsResult = await client.query('SELECT id, name FROM permissions ORDER BY id');
    const rolesResult = await client.query('SELECT id, name FROM roles ORDER BY id');
    
    const allPermissions = permissionsResult.rows;
    const allRoles = rolesResult.rows;
    
    console.log(`📋 Found ${allPermissions.length} permissions and ${allRoles.length} roles`);
    
    // 5. Assign permissions to each role based on hierarchy
    console.log('🔐 Assigning permissions to roles...');
    
    // SUPER_ADMIN (ID 1) - Gets ALL permissions
    for (const permission of allPermissions) {
      await client.query(
        'INSERT INTO role_has_permissions (role_id, permission_id) VALUES ($1, $2)',
        [1, permission.id]
      );
    }
    console.log('✅ SUPER_ADMIN has all permissions');
    
    // ADMIN (ID 2) - Gets most permissions but not super admin wildcards
    const adminPermissions = allPermissions.filter(p => 
      p.name !== '*' && 
      p.name !== 'manage.all' && 
      p.name !== 'access.all'
    );
    for (const permission of adminPermissions) {
      await client.query(
        'INSERT INTO role_has_permissions (role_id, permission_id) VALUES ($1, $2)',
        [2, permission.id]
      );
    }
    console.log(`✅ ADMIN has ${adminPermissions.length} permissions`);
    
    // GENERAL_MANAGER (ID 3) - Business management permissions
    const generalManagerPermissions = allPermissions.filter(p => 
      !p.name.includes('User') && 
      !p.name.includes('Settings') &&
      !p.name.includes('SalaryIncrement') &&
      p.name !== '*' && 
      p.name !== 'manage.all' && 
      p.name !== 'access.all'
    );
    for (const permission of generalManagerPermissions) {
      await client.query(
        'INSERT INTO role_has_permissions (role_id, permission_id) VALUES ($1, $2)',
        [3, permission.id]
      );
    }
    console.log(`✅ GENERAL_MANAGER has ${generalManagerPermissions.length} permissions`);
    
    // HR_MANAGER (ID 4) - HR specific permissions
    const hrPermissions = allPermissions.filter(p => 
      (p.name.includes('Employee') || p.name.includes('Leave') || p.name.includes('Timesheet') || p.name.includes('SalaryIncrement')) &&
      p.name !== '*' && 
      p.name !== 'manage.all' && 
      p.name !== 'access.all'
    );
    for (const permission of hrPermissions) {
      await client.query(
        'INSERT INTO role_has_permissions (role_id, permission_id) VALUES ($1, $2)',
        [4, permission.id]
      );
    }
    console.log(`✅ HR_MANAGER has ${hrPermissions.length} permissions`);
    
    // FINANCE_MANAGER (ID 5) - Financial permissions
    const financePermissions = allPermissions.filter(p => 
      (p.name.includes('Payroll') || p.name.includes('SalaryIncrement') || p.name.includes('Advance') || p.name.includes('Customer')) &&
      p.name !== '*' && 
      p.name !== 'manage.all' && 
      p.name !== 'access.all'
    );
    for (const permission of financePermissions) {
      await client.query(
        'INSERT INTO role_has_permissions (role_id, permission_id) VALUES ($1, $2)',
        [5, permission.id]
      );
    }
    console.log(`✅ FINANCE_MANAGER has ${financePermissions.length} permissions`);
    
    // OPERATIONS_MANAGER (ID 6) - Operations permissions
    const operationsPermissions = allPermissions.filter(p => 
      (p.name.includes('Equipment') || p.name.includes('Maintenance') || p.name.includes('Rental') || p.name.includes('Project')) &&
      p.name !== '*' && 
      p.name !== 'manage.all' && 
      p.name !== 'access.all'
    );
    for (const permission of operationsPermissions) {
      await client.query(
        'INSERT INTO role_has_permissions (role_id, permission_id) VALUES ($1, $2)',
        [6, permission.id]
      );
    }
    console.log(`✅ OPERATIONS_MANAGER has ${operationsPermissions.length} permissions`);
    
    // PROJECT_MANAGER (ID 7) - Project specific permissions
    const projectPermissions = allPermissions.filter(p => 
      (p.name.includes('Project') || p.name.includes('Assignment') || p.name.includes('Timesheet')) &&
      p.name !== '*' && 
      p.name !== 'manage.all' && 
      p.name !== 'access.all'
    );
    for (const permission of projectPermissions) {
      await client.query(
        'INSERT INTO role_has_permissions (role_id, permission_id) VALUES ($1, $2)',
        [7, permission.id]
      );
    }
    console.log(`✅ PROJECT_MANAGER has ${projectPermissions.length} permissions`);
    
    // SALES_MANAGER (ID 8) - Sales and customer permissions
    const salesPermissions = allPermissions.filter(p => 
      (p.name.includes('Customer') || p.name.includes('Quotation') || p.name.includes('Rental')) &&
      p.name !== '*' && 
      p.name !== 'manage.all' && 
      p.name !== 'access.all'
    );
    for (const permission of salesPermissions) {
      await client.query(
        'INSERT INTO role_has_permissions (role_id, permission_id) VALUES ($1, $2)',
        [8, permission.id]
      );
    }
    console.log(`✅ SALES_MANAGER has ${salesPermissions.length} permissions`);
    
    // SUPERVISOR (ID 9) - Team supervision permissions
    const supervisorPermissions = allPermissions.filter(p => 
      (p.name.includes('Employee') || p.name.includes('Timesheet') || p.name.includes('Equipment') || p.name.includes('Assignment')) &&
      !p.name.includes('delete') &&
      p.name !== '*' && 
      p.name !== 'manage.all' && 
      p.name !== 'access.all'
    );
    for (const permission of supervisorPermissions) {
      await client.query(
        'INSERT INTO role_has_permissions (role_id, permission_id) VALUES ($1, $2)',
        [9, permission.id]
      );
    }
    console.log(`✅ SUPERVISOR has ${supervisorPermissions.length} permissions`);
    
    // SENIOR_EMPLOYEE (ID 10) - Extended employee permissions
    const seniorEmployeePermissions = allPermissions.filter(p => 
      p.name.includes('read') &&
      (p.name.includes('Employee') || p.name.includes('Timesheet') || p.name.includes('Equipment') || p.name.includes('Project')) &&
      p.name !== '*' && 
      p.name !== 'manage.all' && 
      p.name !== 'access.all'
    );
    for (const permission of seniorEmployeePermissions) {
      await client.query(
        'INSERT INTO role_has_permissions (role_id, permission_id) VALUES ($1, $2)',
        [10, permission.id]
      );
    }
    console.log(`✅ SENIOR_EMPLOYEE has ${seniorEmployeePermissions.length} permissions`);
    
    // EMPLOYEE (ID 11) - Basic employee permissions
    const employeePermissions = allPermissions.filter(p => 
      p.name.includes('read') &&
      (p.name.includes('Employee') || p.name.includes('Timesheet') || p.name.includes('Equipment')) &&
      p.name !== '*' && 
      p.name !== 'manage.all' && 
      p.name !== 'access.all'
    );
    for (const permission of employeePermissions) {
      await client.query(
        'INSERT INTO role_has_permissions (role_id, permission_id) VALUES ($1, $2)',
        [11, permission.id]
      );
    }
    console.log(`✅ EMPLOYEE has ${employeePermissions.length} permissions`);
    
    // CONTRACTOR (ID 12) - Limited contractor permissions
    const contractorPermissions = allPermissions.filter(p => 
      p.name.includes('read') &&
      (p.name.includes('Equipment') || p.name.includes('Project')) &&
      p.name !== '*' && 
      p.name !== 'manage.all' && 
      p.name !== 'access.all'
    );
    for (const permission of contractorPermissions) {
      await client.query(
        'INSERT INTO role_has_permissions (role_id, permission_id) VALUES ($1, $2)',
        [12, permission.id]
      );
    }
    console.log(`✅ CONTRACTOR has ${contractorPermissions.length} permissions`);
    
    // VIEWER (ID 13) - Read-only permissions
    const viewerPermissions = allPermissions.filter(p => 
      p.name.includes('read') &&
      p.name !== '*' && 
      p.name !== 'manage.all' && 
      p.name !== 'access.all'
    );
    for (const permission of viewerPermissions) {
      await client.query(
        'INSERT INTO role_has_permissions (role_id, permission_id) VALUES ($1, $2)',
        [13, permission.id]
      );
    }
    console.log(`✅ VIEWER has ${viewerPermissions.length} permissions`);
    
    // GUEST (ID 14) - Minimal permissions
    const guestPermissions = allPermissions.filter(p => 
      p.name.includes('read') &&
      (p.name.includes('Company') || p.name.includes('Equipment')) &&
      p.name !== '*' && 
      p.name !== 'manage.all' && 
      p.name !== 'access.all'
    );
    for (const permission of guestPermissions) {
      await client.query(
        'INSERT INTO role_has_permissions (role_id, permission_id) VALUES ($1, $2)',
        [14, permission.id]
      );
    }
    console.log(`✅ GUEST has ${guestPermissions.length} permissions`);
    
    // 6. Verify the Admin user has the SUPER_ADMIN role properly assigned
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
      console.log('✅ Admin user already has SUPER_ADMIN role assigned');
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('🎉 Comprehensive role system created successfully!');
    
    // 7. Display summary
    console.log('\n📊 Role Summary:');
    for (const role of allRoles) {
      const rolePermsResult = await client.query(
        'SELECT COUNT(*) as count FROM role_has_permissions WHERE role_id = $1',
        [role.id]
      );
      const count = rolePermsResult.rows[0].count;
      console.log(`- ${role.name} (ID ${role.id}): ${count} permissions`);
    }
    
    console.log('\n🔑 Key Roles:');
    console.log('- SUPER_ADMIN: Full system access');
    console.log('- ADMIN: System administration');
    console.log('- GENERAL_MANAGER: Business management');
    console.log('- HR_MANAGER: Human resources');
    console.log('- FINANCE_MANAGER: Financial operations');
    console.log('- OPERATIONS_MANAGER: Operations & logistics');
    console.log('- PROJECT_MANAGER: Project coordination');
    console.log('- SALES_MANAGER: Sales & customer management');
    console.log('- SUPERVISOR: Team supervision');
    console.log('- EMPLOYEE: Standard employee access');
    console.log('- VIEWER: Read-only access');
    console.log('- GUEST: Minimal access');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating comprehensive roles:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the creation
createComprehensiveRoles()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
