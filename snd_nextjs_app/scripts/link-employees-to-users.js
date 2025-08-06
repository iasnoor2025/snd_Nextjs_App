const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function linkEmployeesToUsers() {
  try {
    console.log('🔍 Linking employees to users...');
    
    // Get all users with EMPLOYEE role (role_id = 6)
    const employeeUsers = await prisma.user.findMany({
      where: { 
        role_id: 6,
        email: { not: 'admin@ias.com' }
      },
      select: {
        id: true,
        name: true,
        email: true,
        national_id: true
      }
    });
    
    console.log('Employee users found:', employeeUsers.length);
    console.log('Employee users:', JSON.stringify(employeeUsers, null, 2));
    
    // Get employees that don't have user_id linked
    const unlinkedEmployees = await prisma.employee.findMany({
      where: {
        user_id: null
      },
      take: 10, // Limit to first 10 for testing
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        employee_id: true,
        iqama_number: true
      }
    });
    
    console.log('Unlinked employees found:', unlinkedEmployees.length);
    console.log('Sample unlinked employees:', JSON.stringify(unlinkedEmployees, null, 2));
    
    // Link employees to users based on available users
    for (let i = 0; i < Math.min(employeeUsers.length, unlinkedEmployees.length); i++) {
      const user = employeeUsers[i];
      const employee = unlinkedEmployees[i];
      
      console.log(`Linking employee ${employee.employee_id} to user ${user.email}...`);
      
      await prisma.employee.update({
        where: { id: employee.id },
        data: {
          user_id: user.id,
          email: user.email
        }
      });
      
      console.log(`✅ Linked employee ${employee.employee_id} to user ${user.email}`);
    }
    
    console.log('✅ Employee-user linking completed!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

linkEmployeesToUsers();
