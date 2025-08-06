const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function linkEmployeesByEmailOrNationalId() {
  try {
    console.log('🔍 Linking employees to users by email or national ID...');
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        national_id: true
      }
    });
    
    console.log('Total users found:', users.length);
    
    // Get all employees
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        iqama_number: true,
        employee_id: true
      }
    });
    
    console.log('Total employees found:', employees.length);
    
    let linkedCount = 0;
    
    // Link employees to users based on email or national ID
    for (const employee of employees) {
      const matchingUser = users.find(user => 
        (user.email && employee.email && user.email.toLowerCase() === employee.email.toLowerCase()) ||
        (user.national_id && employee.iqama_number && user.national_id === employee.iqama_number)
      );
      
      if (matchingUser) {
        console.log(`✅ Linking employee ${employee.employee_id} (${employee.first_name} ${employee.last_name}) to user ${matchingUser.email}`);
        
        await prisma.employee.update({
          where: { id: employee.id },
          data: {
            user_id: matchingUser.id,
            email: matchingUser.email
          }
        });
        
        linkedCount++;
      }
    }
    
    console.log(`✅ Successfully linked ${linkedCount} employees to users`);
    
    // Show summary of linked employees
    const linkedEmployees = await prisma.employee.findMany({
      where: { user_id: { not: null } },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        employee_id: true,
        email: true,
        user_id: true
      }
    });
    
    console.log('\n📊 Summary of linked employees:');
    linkedEmployees.forEach(emp => {
      console.log(`- ${emp.first_name} ${emp.last_name} (ID: ${emp.employee_id}) -> User ID: ${emp.user_id}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

linkEmployeesByEmailOrNationalId();
