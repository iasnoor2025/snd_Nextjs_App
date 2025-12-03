const { Pool } = require('pg');
require('dotenv').config();

async function verifyIqamaPermissions() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Verifying Iqama Permissions Setup...\n');

    // Count total Iqama permissions
    const countResult = await pool.query(`
      SELECT COUNT(*) as total 
      FROM permissions 
      WHERE name LIKE '%Iqama%' OR name LIKE '%iqama%'
    `);
    
    console.log(`Total Iqama permissions in database: ${countResult.rows[0].total}`);

    // List all Iqama permissions
    const permissionsResult = await pool.query(`
      SELECT name 
      FROM permissions 
      WHERE name LIKE '%Iqama%' OR name LIKE '%iqama%'
      ORDER BY name
    `);
    
    console.log('\nAll Iqama permissions:');
    permissionsResult.rows.forEach(perm => console.log(`  - ${perm.name}`));

    // Check role assignments
    console.log('\n📊 Role Assignments:');
    const rolesResult = await pool.query(`
      SELECT r.name as role_name, COUNT(rhp.permission_id) as permission_count
      FROM roles r
      LEFT JOIN role_has_permissions rhp ON r.id = rhp.role_id
      LEFT JOIN permissions p ON rhp.permission_id = p.id
      WHERE p.name LIKE '%Iqama%' OR p.name LIKE '%iqama%'
      GROUP BY r.id, r.name
      ORDER BY r.name
    `);
    
    rolesResult.rows.forEach(role => {
      console.log(`  ${role.role_name}: ${role.permission_count} Iqama permissions`);
    });

    // Test a specific user's permissions (if any users exist)
    const userResult = await pool.query(`
      SELECT u.id, u.name, u.email, r.name as role_name
      FROM users u
      JOIN model_has_roles mhr ON u.id = mhr.user_id
      JOIN roles r ON mhr.role_id = r.id
      LIMIT 1
    `);

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log(`\n🧪 Testing permissions for user: ${user.name} (${user.role_name})`);
      
      const userPermissionsResult = await pool.query(`
        SELECT p.name
        FROM permissions p
        JOIN role_has_permissions rhp ON p.id = rhp.permission_id
        JOIN model_has_roles mhr ON rhp.role_id = mhr.role_id
        WHERE mhr.user_id = $1 
        AND (p.name LIKE '%Iqama%' OR p.name LIKE '%iqama%')
        ORDER BY p.name
      `, [user.id]);
      
      console.log(`User's Iqama permissions (${userPermissionsResult.rows.length}):`);
      userPermissionsResult.rows.forEach(perm => console.log(`  - ${perm.name}`));
    }

    console.log('\n✅ Iqama permissions verification completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

verifyIqamaPermissions();
