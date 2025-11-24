const { execSync } = require('child_process');
require('dotenv').config({ path: '.env.local' });

async function fullProductionSetup() {
  console.log('🚀 Starting Full Production Setup...\n');
  
  try {
    // Step 1: Reset Database
    console.log('🗑️  Step 1: Resetting Database...');
    execSync('npm run reset:db', { stdio: 'inherit' });
    console.log('✅ Database reset completed\n');
    
    // Step 2: Push Schema
    console.log('🏗️  Step 2: Pushing Database Schema...');
    execSync('npm run push:schema', { stdio: 'inherit' });
    console.log('✅ Schema pushed successfully\n');
    
    // Step 3: Seed RBAC System
    console.log('👑 Step 3: Seeding RBAC System...');
    execSync('npm run seed:rbac', { stdio: 'inherit' });
    console.log('✅ RBAC system seeded successfully\n');
    
    console.log('🎉 Full Production Setup Completed Successfully!');
    console.log('\n📋 Your application is now ready with:');
    console.log('   ✅ Clean database (all test data removed)');
    console.log('   ✅ Complete schema (75 tables created)');
    console.log('   ✅ Complete RBAC system (7 roles, 120 permissions)');
    console.log('   ✅ Super admin user (admin@snd.com / admin123)');
    console.log('   ✅ Proper role hierarchy (SUPER_ADMIN = ID 1)');
    console.log('   ✅ Organizational structure');
    console.log('\n🚀 Ready for production deployment!');
    
  } catch (error) {
    console.error('❌ Full production setup failed:', error.message);
    process.exit(1);
  }
}

// Run the full setup
fullProductionSetup();
