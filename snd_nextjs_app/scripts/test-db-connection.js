import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users, roles } from '../src/lib/drizzle/schema.js';

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function testDatabaseConnection() {
  try {
    console.log('🧪 Testing database connection...');
    
    // Test 1: Fetch all roles
    console.log('\n📋 Test 1: Fetching all roles...');
    const allRoles = await db
      .select({
        id: roles.id,
        name: roles.name,
      })
      .from(roles);
    
    console.log('✅ Roles fetched successfully:', allRoles);
    
    // Test 2: Fetch all users with role_id
    console.log('\n👥 Test 2: Fetching all users...');
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        roleId: users.roleId,
      })
      .from(users);
    
    console.log('✅ Users fetched successfully:', allUsers);
    
    // Test 3: Test role mapping
    console.log('\n🔗 Test 3: Testing role mapping...');
    allUsers.forEach(user => {
      const role = allRoles.find(r => r.id === user.roleId);
      console.log(`User: ${user.name}, role_id: ${user.roleId}, mapped role: ${role?.name || 'NOT FOUND'}`);
    });
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the test
testDatabaseConnection()
  .then(() => {
    console.log('✅ Test script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
