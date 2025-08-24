import { config } from 'dotenv';
import { resolve } from 'path';
import { pool } from '../lib/drizzle';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../../.env.local') });

async function addRolePriority() {
  try {
    console.log('🔧 Adding role priority field...\n');
    
    // Check if priority column already exists
    const columnExists = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'roles' AND column_name = 'priority'
    `);
    
    if (columnExists.rows.length > 0) {
      console.log('✅ Priority column already exists');
    } else {
      // Add priority column
      console.log('📝 Adding priority column to roles table...');
      await pool.query('ALTER TABLE roles ADD COLUMN priority INTEGER DEFAULT 10');
      console.log('✅ Priority column added');
    }
    
    // Set default priorities for existing roles
    console.log('\n📊 Setting default role priorities...');
    
    const priorities = [
      { name: 'SUPER_ADMIN', priority: 1 },
      { name: 'ADMIN', priority: 2 },
      { name: 'MANAGER', priority: 3 },
      { name: 'SUPERVISOR', priority: 4 },
      { name: 'OPERATOR', priority: 5 },
      { name: 'EMPLOYEE', priority: 6 },
      { name: 'USER', priority: 7 },
    ];
    
    for (const role of priorities) {
      try {
        await pool.query(
          'UPDATE roles SET priority = $1 WHERE name = $2',
          [role.priority, role.name]
        );
        console.log(`  ✅ ${role.name}: priority ${role.priority}`);
      } catch (error) {
        console.log(`  ⚠️ ${role.name}: already has priority set`);
      }
    }
    
    // Show current roles with priorities
    console.log('\n📋 Current roles with priorities:');
    const roles = await pool.query('SELECT name, priority FROM roles ORDER BY priority');
    roles.rows.forEach((role: any) => {
      console.log(`  - ${role.name}: priority ${role.priority}`);
    });
    
    console.log('\n🎉 Role priority setup completed!');
    
  } catch (error) {
    console.error('❌ Error setting up role priority:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

addRolePriority();
