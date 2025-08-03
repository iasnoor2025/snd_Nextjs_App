import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database contents...');

    // Check users
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        national_id: true,
        role_id: true,
      }
    });
    console.log('👥 Users found:', users.length);
    users.forEach(user => console.log(`  - ${user.name} (${user.email}) - National ID: ${user.national_id}`));

    // Check employees
    const employees = await prisma.employee.findMany({
      take: 5,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        employee_id: true,
        email: true,
        iqama_number: true,
        user_id: true,
      }
    });
    console.log('👷 Employees found:', employees.length);
    employees.forEach(emp => console.log(`  - ${emp.first_name} ${emp.last_name} (${emp.employee_id}) - Iqama: ${emp.iqama_number} - User ID: ${emp.user_id}`));

    // Check departments
    const departments = await prisma.department.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
      }
    });
    console.log('🏢 Departments found:', departments.length);
    departments.forEach(dept => console.log(`  - ${dept.name}`));

    // Check designations
    const designations = await prisma.designation.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
      }
    });
    console.log('👔 Designations found:', designations.length);
    designations.forEach(desig => console.log(`  - ${desig.name}`));

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase(); 