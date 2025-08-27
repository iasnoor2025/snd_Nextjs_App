const { db } = require('../src/lib/drizzle');
const { users, modelHasRoles, roles } = require('../src/lib/drizzle/schema');
const { eq } = require('drizzle-orm');

async function checkUserRole() {
  try {
    console.log('Checking user roles...\n');

    // Get all users with their roles
    const usersWithRoles = await db
      .select({
        userId: users.id,
        email: users.email,
        name: users.name,
        roleName: roles.name,
      })
      .from(users)
      .leftJoin(modelHasRoles, eq(users.id, modelHasRoles.userId))
      .leftJoin(roles, eq(modelHasRoles.roleId, roles.id))
      .orderBy(users.id);

    console.log('Users and their roles:');
    console.log('=======================');
    
    let currentUser = null;
    usersWithRoles.forEach((user, index) => {
      if (index === 0 || user.userId !== usersWithRoles[index - 1]?.userId) {
        if (currentUser) {
          console.log(`  Roles: ${currentUser.roles.join(', ') || 'No roles assigned'}`);
          console.log('');
        }
        currentUser = {
          id: user.userId,
          email: user.email,
          name: user.name,
          roles: []
        };
        console.log(`User ID: ${user.userId}`);
        console.log(`Email: ${user.email}`);
        console.log(`Name: ${user.name}`);
      }
      if (user.roleName) {
        currentUser.roles.push(user.roleName);
      }
    });

    if (currentUser) {
      console.log(`  Roles: ${currentUser.roles.join(', ') || 'No roles assigned'}`);
    }

    console.log('\nChecking available roles:');
    console.log('========================');
    const allRoles = await db.select().from(roles);
    allRoles.forEach(role => {
      console.log(`- ${role.name} (ID: ${role.id})`);
    });

    console.log('\nTo fix SUPER_ADMIN access:');
    console.log('1. Find the user ID you want to make SUPER_ADMIN');
    console.log('2. Run: node scripts/make-super-admin.js <user_id>');

  } catch (error) {
    console.error('Error checking user roles:', error);
  } finally {
    process.exit(0);
  }
}

checkUserRole();
