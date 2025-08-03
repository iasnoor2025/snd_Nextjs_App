import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function linkUserToEmployee() {
  try {
    console.log('🔗 Linking user to employee...');

    // First, let's check if we have any users
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        national_id: true,
      }
    });

    console.log('Available users:', users);

    // Get the first employee
    const employee = await prisma.employee.findFirst({
      where: { employee_id: 'EMP001' },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        iqama_number: true,
      }
    });

    if (!employee) {
      console.log('❌ No employee found');
      return;
    }

    console.log('Found employee:', employee);

    // Update the first user to link to this employee
    if (users.length > 0) {
      const userToUpdate = users[0];
      
      const updatedUser = await prisma.user.update({
        where: { id: userToUpdate.id },
        data: {
          name: `${employee.first_name} ${employee.last_name}`,
          email: employee.email,
          national_id: employee.iqama_number, // This will enable matching
        },
        select: {
          id: true,
          name: true,
          email: true,
          national_id: true,
        }
      });

      console.log('✅ Updated user:', updatedUser);

      // Also link the employee to the user
      const updatedEmployee = await prisma.employee.update({
        where: { id: employee.id },
        data: {
          user_id: userToUpdate.id,
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          user_id: true,
        }
      });

      console.log('✅ Updated employee:', updatedEmployee);
    }

  } catch (error) {
    console.error('❌ Error linking user to employee:', error);
  } finally {
    await prisma.$disconnect();
  }
}

linkUserToEmployee(); 