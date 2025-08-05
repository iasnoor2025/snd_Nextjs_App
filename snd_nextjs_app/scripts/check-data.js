const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  console.log('🔍 Checking departments and designations...');

  try {
    // Check departments
    const departments = await prisma.department.findMany();
    console.log(`\n📊 Found ${departments.length} departments:`);
    departments.forEach(dept => {
      console.log(`   - ${dept.name} (ID: ${dept.id})`);
    });

    // Check designations
    const designations = await prisma.designation.findMany();
    console.log(`\n📊 Found ${designations.length} designations:`);
    designations.forEach(desig => {
      console.log(`   - ${desig.name} (ID: ${desig.id}, Department: ${desig.department_id || 'None'})`);
    });

    // Check employees with department/designation
    const employeesWithDept = await prisma.employee.count({
      where: {
        department_id: { not: null }
      }
    });

    const employeesWithDesig = await prisma.employee.count({
      where: {
        designation_id: { not: null }
      }
    });

    console.log(`\n👥 Employees with department assigned: ${employeesWithDept}`);
    console.log(`👥 Employees with designation assigned: ${employeesWithDesig}`);

    // Show sample employees with department/designation
    const sampleEmployees = await prisma.employee.findMany({
      where: {
        OR: [
          { department_id: { not: null } },
          { designation_id: { not: null } }
        ]
      },
      include: {
        department: true,
        designation: true
      },
      take: 5
    });

    if (sampleEmployees.length > 0) {
      console.log(`\n📋 Sample employees with department/designation:`);
      sampleEmployees.forEach(emp => {
        console.log(`   - ${emp.first_name} ${emp.last_name} (Dept: ${emp.department?.name || 'None'}, Desig: ${emp.designation?.name || 'None'})`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData(); 