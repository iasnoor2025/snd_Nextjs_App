const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEmployees() {
  try {
    console.log('🔍 Checking employees in database...');
    
    // Check total employees
    const totalEmployees = await prisma.employee.count();
    console.log('Total employees:', totalEmployees);
    
    // Get first 5 employees
    const employees = await prisma.employee.findMany({
      take: 5,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        user_id: true,
        employee_id: true,
        department: {
          select: { name: true }
        },
        designation: {
          select: { name: true }
        }
      }
    });
    
    console.log('Sample employees:', JSON.stringify(employees, null, 2));
    
    // Check users
    const totalUsers = await prisma.user.count();
    console.log('Total users:', totalUsers);
    
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        role_id: true,
        national_id: true
      }
    });
    
    console.log('Sample users:', JSON.stringify(users, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmployees();
