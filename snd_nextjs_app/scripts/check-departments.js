const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDepartments() {
  try {
    console.log('🔍 Checking departments and designations...');
    
    // Check departments
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        code: true
      }
    });
    
    console.log('Departments:', JSON.stringify(departments, null, 2));
    
    // Check designations
    const designations = await prisma.designation.findMany({
      select: {
        id: true,
        name: true,
        department_id: true
      }
    });
    
    console.log('Designations:', JSON.stringify(designations, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDepartments();
