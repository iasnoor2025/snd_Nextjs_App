const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateEmployeeDepartment() {
  try {
    console.log('🔍 Updating employee with department and designation...');
    
    // Update the employee (ID 1) with department and designation
    const updatedEmployee = await prisma.employee.update({
      where: { id: 1 },
      data: {
        department_id: 1, // Information Technology
        designation_id: 2  // Administrative Officer
      }
    });
    
    console.log('✅ Successfully updated employee:', {
      id: updatedEmployee.id,
      name: `${updatedEmployee.first_name} ${updatedEmployee.last_name}`,
      department_id: updatedEmployee.department_id,
      designation_id: updatedEmployee.designation_id
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateEmployeeDepartment();
