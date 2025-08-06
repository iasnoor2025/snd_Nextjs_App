const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function linkEmployeeToUser() {
  try {
    console.log('🔍 Linking employee to user for testing...');
    
    // Get the first employee
    const employee = await prisma.employee.findFirst({
      where: { id: 1 }
    });
    
    console.log('Employee to link:', employee);
    
    // Get the user with role_id 6 (EMPLOYEE role)
    const user = await prisma.user.findFirst({
      where: { 
        role_id: 6,
        email: { not: 'admin@ias.com' }
      }
    });
    
    console.log('User to link:', user);
    
    if (employee && user) {
      // Update the employee to link to the user
      const updatedEmployee = await prisma.employee.update({
        where: { id: employee.id },
        data: {
          user_id: user.id,
          email: user.email
        }
      });
      
      console.log('✅ Successfully linked employee to user:', updatedEmployee);
    } else {
      console.log('❌ Could not find employee or user to link');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

linkEmployeeToUser();
