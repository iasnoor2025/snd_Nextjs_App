const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

async function checkUserRole() {
  try {
    // Connect to database
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.error('❌ DATABASE_URL not found in environment variables');
      return;
    }

    const client = postgres(connectionString);
    const db = drizzle(client);

    // Import schema and functions
    const { users, roles, modelHasRoles } = require('../src/lib/drizzle/schema.js');
    const { eq } = require('drizzle-orm');

    console.log('🔍 Checking user roles in database...\n');

    // Get all users with their roles
    const usersWithRoles = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role_id: users.roleId,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.createdAt);

    console.log('👥 Users found:', usersWithRoles.length);
    console.log('📋 User details:');
    
    for (const user of usersWithRoles) {
      console.log(`\n👤 User: ${user.name} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   role_id: ${user.role_id}`);
      console.log(`   Last Login: ${user.lastLoginAt || 'Never'}`);
      console.log(`   Created: ${user.createdAt}`);
      
      // Check if user has entries in modelHasRoles
      const userRoles = await db
        .select({
          role_id: modelHasRoles.roleId,
        })
        .from(modelHasRoles)
        .where(eq(modelHasRoles.userId, user.id));
      
      if (userRoles.length > 0) {
        console.log(`   🔗 modelHasRoles entries: ${userRoles.length}`);
        for (const userRole of userRoles) {
          // Get role name
          const role = await db
            .select({ name: roles.name })
            .from(roles)
            .where(eq(roles.id, userRole.role_id))
            .limit(1);
          
          if (role[0]) {
            console.log(`      - Role ID ${userRole.role_id}: ${role[0].name}`);
          }
        }
      } else {
        console.log(`   🔗 modelHasRoles entries: None`);
      }
    }

    // Check roles table
    console.log('\n🔍 Available roles in system:');
    const allRoles = await db
      .select({
        id: roles.id,
        name: roles.name,
      })
      .from(roles)
      .orderBy(roles.id);
    
    for (const role of allRoles) {
      console.log(`   ${role.id}: ${role.name}`);
    }

    await client.end();
    console.log('\n✅ Database check completed');
    
  } catch (error) {
    console.error('❌ Error checking user roles:', error);
  }
}

checkUserRole();
