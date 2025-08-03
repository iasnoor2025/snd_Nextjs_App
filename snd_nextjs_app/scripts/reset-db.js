import { prisma } from '@/lib/db';
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function resetDatabase() {
  try {
    console.log('🔄 Starting database reset...');

    // Clear all data from all tables
    console.log('🗑️  Clearing all data...');

    // Delete in order to respect foreign key constraints
    await prisma.payrollItem.deleteMany();
    await prisma.payroll.deleteMany();
    await prisma.payrollRun.deleteMany();
    await prisma.timesheet.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ All data cleared successfully');

    // Create admin user
    console.log('👤 Creating admin user...');

    const hashedPassword = await bcrypt.hash('password', 12);

    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@ias.com',
        password: hashedPassword,
        national_id: '1234567890', // Default admin national ID
        role_id: 1, // Admin role
        status: 1, // Active status
        isActive: true,
      },
    });

    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@ias.com');
    console.log('🔑 Password: password');
    console.log('🆔 User ID:', adminUser.id);

    console.log('🎉 Database reset completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('- All existing data has been removed');
    console.log('- Admin user created with credentials:');
    console.log('  Email: admin@ias.com');
    console.log('  Password: password');
    console.log('- Database is now ready for fresh data');

  } catch (error) {
    console.error('❌ Error during database reset:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reset if this script is executed directly
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('✅ Database reset completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database reset failed:', error);
      process.exit(1);
    });
}

module.exports = { resetDatabase };
