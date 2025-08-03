const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkNationalId() {
  try {
    console.log('Checking National ID in database...\n');

    // Check all users and their national_id
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        national_id: true,
      },
    });

    console.log('All Users and their National IDs:');
    console.log('================================');
    users.forEach(user => {
      console.log(`ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, National ID: ${user.national_id || 'NULL'}`);
    });

    console.log('\n================================');
    console.log(`Total users: ${users.length}`);
    console.log(`Users with National ID: ${users.filter(u => u.national_id).length}`);
    console.log(`Users without National ID: ${users.filter(u => !u.national_id).length}`);

    // Check employees with iqama_number
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        employee_id: true,
        iqama_number: true,
        user_id: true,
      },
      where: {
        iqama_number: {
          not: null,
        },
      },
    });

    console.log('\nEmployees with Iqama Numbers:');
    console.log('==============================');
    employees.forEach(emp => {
      console.log(`ID: ${emp.id}, Name: ${emp.first_name} ${emp.last_name}, Employee ID: ${emp.employee_id}, Iqama: ${emp.iqama_number}, User ID: ${emp.user_id}`);
    });

    console.log('\n================================');
    console.log(`Total employees with Iqama: ${employees.length}`);

    // Check for potential matches
    console.log('\nPotential Nation ID to Iqama Matches:');
    console.log('=====================================');
    users.forEach(user => {
      if (user.national_id) {
        const matchingEmployee = employees.find(emp => emp.iqama_number === user.national_id);
        if (matchingEmployee) {
          console.log(`✅ MATCH: User ${user.name} (${user.email}) has National ID "${user.national_id}" which matches Employee ${matchingEmployee.first_name} ${matchingEmployee.last_name} Iqama "${matchingEmployee.iqama_number}"`);
        } else {
          console.log(`❌ NO MATCH: User ${user.name} (${user.email}) has National ID "${user.national_id}" but no matching Iqama found`);
        }
      } else {
        console.log(`⚠️  NO NATIONAL ID: User ${user.name} (${user.email}) has no National ID set`);
      }
    });

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNationalId(); 