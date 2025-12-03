import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users, roles, modelHasRoles } from '../src/lib/drizzle/schema.js';
import { sql } from 'drizzle-orm';

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function migrateUserRoles() {
  try {
    console.log('🔄 Starting user role migration...');
    
    // Get all users with their current role_id
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        roleId: users.roleId,
      })
      .from(users);
    
    console.log(`📊 Found ${allUsers.length} users to migrate`);
    
    // Get all available roles
    const allRoles = await db
      .select({
        id: roles.id,
        name: roles.name,
      })
      .from(roles);
    
    console.log(`🎭 Found ${allRoles.length} available roles`);
    
    // Create a mapping of role_id to role name for validation
    const roleMap = new Map(allRoles.map(role => [role.id, role.name]));
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const user of allUsers) {
      try {
        if (!user.roleId) {
          console.log(`⚠️  User ${user.email} has no role_id, skipping...`);
          skippedCount++;
          continue;
        }
        
        // Check if role exists
        if (!roleMap.has(user.roleId)) {
          console.log(`❌ User ${user.email} has invalid role_id ${user.roleId}, skipping...`);
          errorCount++;
          continue;
        }
        
        // Check if relationship already exists
        const existingRelation = await db
          .select()
          .from(modelHasRoles)
          .where(
            sql`${modelHasRoles.userId} = ${user.id} AND ${modelHasRoles.roleId} = ${user.roleId}`
          );
        
        if (existingRelation.length > 0) {
          console.log(`✅ User ${user.email} already has role ${roleMap.get(user.roleId)}, skipping...`);
          skippedCount++;
          continue;
        }
        
        // Insert the role relationship
        await db.insert(modelHasRoles).values({
          userId: user.id,
          roleId: user.roleId,
        });
        
        console.log(`✅ Migrated user ${user.email} to role ${roleMap.get(user.roleId)}`);
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Error migrating user ${user.email}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount} users`);
    console.log(`⏭️  Skipped (already migrated): ${skippedCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
    console.log(`📊 Total processed: ${allUsers.length} users`);
    
    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    const totalRelationships = await db
      .select({ count: sql`count(*)` })
      .from(modelHasRoles);
    
    console.log(`📊 Total role relationships in modelHasRoles: ${totalRelationships[0]?.count || 0}`);
    
    console.log('\n🎉 User role migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
migrateUserRoles()
  .then(() => {
    console.log('✅ Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
