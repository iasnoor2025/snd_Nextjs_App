const { Pool } = require('pg');
require('dotenv').config();

async function checkRBACStatus() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Checking RBAC Status...\n');

    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'roles', 'permissions', 'model_has_roles', 'role_has_permissions')
      ORDER BY table_name;
    `;
    
    const tables = await pool.query(tablesQuery);
    console.log('📋 Available RBAC Tables:');
    tables.rows.forEach(row => console.log(`  ✅ ${row.table_name}`));
    console.log('');

    // Check roles
    const rolesQuery = 'SELECT id, name FROM roles ORDER BY id;';
    const roles = await pool.query(rolesQuery);
    console.log('👥 Available Roles:');
    roles.rows.forEach(row => console.log(`  ${row.id}: ${row.name}`));
    console.log('');

    // Check permissions
    const permissionsQuery = 'SELECT id, name FROM permissions ORDER BY id;';
    const permissions = await pool.query(permissionsQuery);
    console.log('🔐 Available Permissions:');
    permissions.rows.forEach(row => console.log(`  ${row.id}: ${row.name}`));
    console.log('');

    // Check role-permission mappings
    const rolePermissionsQuery = `
      SELECT r.name as role_name, p.name as permission_name
      FROM role_has_permissions rhp
      JOIN roles r ON r.id = rhp.role_id
      JOIN permissions p ON p.id = rhp.permission_id
      ORDER BY r.name, p.name;
    `;
    const rolePermissions = await pool.query(rolePermissionsQuery);
    console.log('🔗 Role-Permission Mappings:');
    rolePermissions.rows.forEach(row => console.log(`  ${row.role_name} -> ${row.permission_name}`));
    console.log('');

    // Check user-role mappings
    const userRolesQuery = `
      SELECT u.email, r.name as role_name
      FROM model_has_roles mhr
      JOIN users u ON u.id = mhr.user_id
      JOIN roles r ON r.id = mhr.role_id
      ORDER BY u.email;
    `;
    const userRoles = await pool.query(userRolesQuery);
    console.log('👤 User-Role Mappings:');
    userRoles.rows.forEach(row => console.log(`  ${row.email} -> ${row.role_name}`));
    console.log('');

    // Check for missing permissions
    const requiredPermissions = [
      'read.User', 'create.User', 'update.User', 'delete.User', 'manage.User',
      'read.Employee', 'create.Employee', 'update.Employee', 'delete.Employee', 'manage.Employee',
      'read.Customer', 'create.Customer', 'update.Customer', 'delete.Customer', 'manage.Customer',
      'read.Equipment', 'create.Equipment', 'update.Equipment', 'delete.Equipment', 'manage.Equipment',
      'read.Project', 'create.Project', 'update.Project', 'delete.Project', 'manage.Project',
      'read.Rental', 'create.Rental', 'update.Rental', 'delete.Rental', 'manage.Rental',
      'read.Quotation', 'create.Quotation', 'update.Quotation', 'delete.Quotation', 'manage.Quotation',
      'read.Payroll', 'create.Payroll', 'update.Payroll', 'delete.Payroll', 'manage.Payroll',
      'read.Timesheet', 'create.Timesheet', 'update.Timesheet', 'delete.Timesheet', 'manage.Timesheet',
      'read.Leave', 'create.Leave', 'update.Leave', 'delete.Leave', 'manage.Leave',
      'read.Department', 'create.Department', 'update.Department', 'delete.Department', 'manage.Department',
      'read.Designation', 'create.Designation', 'update.Designation', 'delete.Designation', 'manage.Designation',
      'read.Company', 'create.Company', 'update.Company', 'delete.Company', 'manage.Company',
      'read.Settings', 'create.Settings', 'update.Settings', 'delete.Settings', 'manage.Settings',
      'read.Location', 'create.Location', 'update.Location', 'delete.Location', 'manage.Location',
      'read.Maintenance', 'create.Maintenance', 'update.Maintenance', 'delete.Maintenance', 'manage.Maintenance',
      'read.Safety', 'create.Safety', 'update.Safety', 'delete.Safety', 'manage.Safety',
      'read.SalaryIncrement', 'create.SalaryIncrement', 'update.SalaryIncrement', 'delete.SalaryIncrement', 'manage.SalaryIncrement',
      'read.Advance', 'create.Advance', 'update.Advance', 'delete.Advance', 'manage.Advance',
      'read.Assignment', 'create.Assignment', 'update.Assignment', 'delete.Assignment', 'manage.Assignment',
      'read.Report', 'create.Report', 'update.Report', 'delete.Report', 'manage.Report', 'export.Report',
      'read.employee-document', 'create.employee-document', 'update.employee-document', 'delete.employee-document', 'manage.employee-document',
      '*', 'manage.all'
    ];

    const existingPermissions = permissions.rows.map(p => p.name);
    const missingPermissions = requiredPermissions.filter(p => !existingPermissions.includes(p));
    
    if (missingPermissions.length > 0) {
      console.log('❌ Missing Permissions:');
      missingPermissions.forEach(p => console.log(`  ${p}`));
      console.log('');
    } else {
      console.log('✅ All required permissions exist');
    }

    // Check for missing roles
    const requiredRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'EMPLOYEE', 'USER'];
    const existingRoles = roles.rows.map(r => r.name.toUpperCase());
    const missingRoles = requiredRoles.filter(r => !existingRoles.includes(r));
    
    if (missingRoles.length > 0) {
      console.log('❌ Missing Roles:');
      missingRoles.forEach(r => console.log(`  ${r}`));
      console.log('');
    } else {
      console.log('✅ All required roles exist');
    }

  } catch (error) {
    console.error('❌ Error checking RBAC status:', error);
  } finally {
    await pool.end();
  }
}

checkRBACStatus();
