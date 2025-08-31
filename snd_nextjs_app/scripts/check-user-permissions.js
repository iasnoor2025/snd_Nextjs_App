const { Pool } = require('pg');
require('dotenv').config();

async function checkUserPermissions(userEmail) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log(`🔍 Checking permissions for user: ${userEmail}\n`);

    // Find user by email
    const userQuery = `
      SELECT u.id, u.email, u.name, u.role_id, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1
    `;
    
    const userResult = await pool.query(userQuery, [userEmail]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = userResult.rows[0];
    console.log(`👤 User found:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role ID: ${user.role_id}`);
    console.log(`   Role Name: ${user.role_name}\n`);

    // Get role permissions
    if (user.role_id) {
      const rolePermissionsQuery = `
        SELECT p.name as permission_name
        FROM role_has_permissions rhp
        JOIN permissions p ON rhp.permission_id = p.id
        WHERE rhp.role_id = $1
        ORDER BY p.name
      `;
      
      const rolePermissionsResult = await pool.query(rolePermissionsQuery, [user.role_id]);
      const rolePermissions = rolePermissionsResult.rows.map(row => row.permission_name);
      
      console.log(`🔐 Role Permissions (${rolePermissions.length}):`);
      rolePermissions.forEach(perm => console.log(`   ✅ ${perm}`));
      
      // Check specifically for own-profile permissions
      const ownProfilePermissions = rolePermissions.filter(perm => perm.includes('own-profile'));
      console.log(`\n🎯 Own Profile Permissions (${ownProfilePermissions.length}):`);
      ownProfilePermissions.forEach(perm => console.log(`   ✅ ${perm}`));
      
      if (ownProfilePermissions.length === 0) {
        console.log('   ❌ No own-profile permissions found!');
      }
    }

    // Get direct user permissions
    const directPermissionsQuery = `
      SELECT p.name as permission_name
      FROM model_has_permissions mhp
      JOIN permissions p ON mhp.permission_id = p.id
      WHERE mhp.user_id = $1
      ORDER BY p.name
    `;
    
    const directPermissionsResult = await pool.query(directPermissionsQuery, [user.id]);
    const directPermissions = directPermissionsResult.rows.map(row => row.permission_name);
    
    console.log(`\n🔑 Direct User Permissions (${directPermissions.length}):`);
    directPermissions.forEach(perm => console.log(`   ✅ ${perm}`));
    
    // Check specifically for own-profile permissions
    const directOwnProfilePermissions = directPermissions.filter(perm => perm.includes('own-profile'));
    console.log(`\n🎯 Direct Own Profile Permissions (${directOwnProfilePermissions.length}):`);
    directOwnProfilePermissions.forEach(perm => console.log(`   ✅ ${perm}`));
    
    if (directOwnProfilePermissions.length === 0) {
      console.log('   ❌ No direct own-profile permissions found!');
    }

    // Summary
    const totalOwnProfilePermissions = [...new Set([...ownProfilePermissions, ...directOwnProfilePermissions])];
    console.log(`\n📊 Summary:`);
    console.log(`   Total own-profile permissions: ${totalOwnProfilePermissions.length}`);
    console.log(`   Can read own-profile: ${totalOwnProfilePermissions.includes('read.own-profile') ? '✅ YES' : '❌ NO'}`);
    console.log(`   Can update own-profile: ${totalOwnProfilePermissions.includes('update.own-profile') ? '✅ YES' : '❌ NO'}`);
    console.log(`   Can manage own-profile: ${totalOwnProfilePermissions.includes('manage.own-profile') ? '✅ YES' : '❌ NO'}`);

  } catch (error) {
    console.error('❌ Error checking user permissions:', error);
  } finally {
    await pool.end();
  }
}

// Get email from command line argument
const userEmail = process.argv[2];

if (!userEmail) {
  console.log('Usage: node scripts/check-user-permissions.js <user-email>');
  console.log('Example: node scripts/check-user-permissions.js admin@example.com');
  process.exit(1);
}

checkUserPermissions(userEmail);
