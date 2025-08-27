const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function createSuperAdmin() {
  let client;
  
  if (process.env.DATABASE_URL) {
    console.log('🔗 Using DATABASE_URL connection...');
    client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
  } else {
    console.log('🔗 Using individual database parameters...');
    client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    });
  }

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Start transaction
    await client.query('BEGIN');

    console.log('👑 Creating super admin user and roles...');

    // 1. Create super admin role
    console.log('1. Creating super admin role...');
    await client.query(`
      INSERT INTO roles (name, guard_name, created_at, updated_at) 
      VALUES ('super_admin', 'web', CURRENT_DATE, CURRENT_DATE)
      ON CONFLICT (name) DO NOTHING
      RETURNING id
    `);

    const roleResult = await client.query(`
      SELECT id FROM roles WHERE name = 'super_admin'
    `);
    const roleId = roleResult.rows[0].id;
    console.log(`   ✅ Super admin role created with ID: ${roleId}`);

    // 2. Create basic permissions
    console.log('2. Creating basic permissions...');
    const permissions = [
      'user.create', 'user.read', 'user.update', 'user.delete',
      'employee.create', 'employee.read', 'employee.update', 'employee.delete',
      'project.create', 'project.read', 'project.update', 'project.delete',
      'equipment.create', 'equipment.read', 'equipment.update', 'equipment.delete',
      'rental.create', 'rental.read', 'rental.update', 'rental.delete',
      'timesheet.create', 'timesheet.read', 'timesheet.update', 'timesheet.delete',
      'payroll.create', 'payroll.read', 'payroll.update', 'payroll.delete',
      'system.settings', 'system.admin', 'system.reports'
    ];

    for (const permission of permissions) {
      await client.query(`
        INSERT INTO permissions (name, guard_name, created_at, updated_at) 
        VALUES ($1, 'web', CURRENT_DATE, CURRENT_DATE)
        ON CONFLICT (name) DO NOTHING
      `, [permission]);
    }
    console.log(`   ✅ ${permissions.length} permissions created`);

    // 3. Assign all permissions to super admin role
    console.log('3. Assigning permissions to super admin role...');
    for (const permission of permissions) {
      const permResult = await client.query(`
        SELECT id FROM permissions WHERE name = $1
      `, [permission]);
      
      if (permResult.rows.length > 0) {
        const permId = permResult.rows[0].id;
        await client.query(`
          INSERT INTO role_has_permissions (permission_id, role_id) 
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [permId, roleId]);
      }
    }
    console.log('   ✅ All permissions assigned to super admin role');

    // 4. Create super admin user
    console.log('4. Creating super admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    await client.query(`
      INSERT INTO users (name, email, password, role_id, status, "isActive", created_at, updated_at) 
      VALUES ('Super Admin', 'admin@snd.com', $1, $2, 1, true, CURRENT_DATE, CURRENT_DATE)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, [hashedPassword, roleId]);

    const userResult = await client.query(`
      SELECT id FROM users WHERE email = 'admin@snd.com'
    `);
    const userId = userResult.rows[0].id;
    console.log(`   ✅ Super admin user created with ID: ${userId}`);

    // 5. Assign role to user
    console.log('5. Assigning super admin role to user...');
    await client.query(`
      INSERT INTO model_has_roles (role_id, user_id) 
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [roleId, userId]);
    console.log('   ✅ Role assigned to user');

    // 6. Create basic departments and designations
    console.log('6. Creating basic organizational structure...');
    
    // Create default department
    const deptResult = await client.query(`
      INSERT INTO departments (name, code, description, active, created_at, updated_at) 
      VALUES ('General', 'GEN', 'General Department', true, CURRENT_DATE, CURRENT_DATE)
      ON CONFLICT DO NOTHING
      RETURNING id
    `);
    const deptId = deptResult.rows[0]?.id;

    // Create default designation
    if (deptId) {
      await client.query(`
        INSERT INTO designations (name, description, department_id, is_active, created_at, updated_at) 
        VALUES ('Administrator', 'System Administrator', $1, true, CURRENT_DATE, CURRENT_DATE)
        ON CONFLICT DO NOTHING
      `, [deptId]);
    }

    // Commit transaction
    await client.query('COMMIT');
    
    console.log('\n🎉 Super Admin setup completed successfully!');
    console.log('📋 Login Credentials:');
    console.log('   Email: admin@snd.com');
    console.log('   Password: admin123');
    console.log('   Role: Super Admin');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Super admin creation failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the setup
createSuperAdmin();
