import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupAdmin() {
  try {
    console.log('🔧 Setting up admin user...');

    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 10);
    console.log('✅ Password hashed');

    // Create or update admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@ias.com' },
      update: {
        name: 'Admin User',
        password: hashedPassword,
        role_id: 5, // Admin role
        isActive: true,
        national_id: '1234567890', // Match with employee
      },
      create: {
        name: 'Admin User',
        email: 'admin@ias.com',
        password: hashedPassword,
        role_id: 5, // Admin role
        isActive: true,
        national_id: '1234567890', // Match with employee
      },
    });

    console.log('✅ Admin user created/updated:', adminUser);

    // Link the admin user to the first employee
    const employee = await prisma.employee.findFirst({
      where: { employee_id: 'EMP001' },
    });

    if (employee) {
      const updatedEmployee = await prisma.employee.update({
        where: { id: employee.id },
        data: {
          user_id: adminUser.id,
        },
      });
      console.log('✅ Employee linked to admin user:', updatedEmployee);
    }

    console.log('🎉 Admin setup complete!');
    console.log('📧 Email: admin@ias.com');
    console.log('🔑 Password: password123');

  } catch (error) {
    console.error('❌ Error setting up admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin(); 