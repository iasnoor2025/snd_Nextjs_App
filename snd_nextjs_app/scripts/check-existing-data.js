const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkExistingData() {
  try {
    console.log('=== Checking Existing Data ===\n');

    // Check customers
    const customers = await prisma.customer.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        company_name: true,
        contact_person: true,
        email: true
      }
    });
    console.log(`Customers (${customers.length}):`);
    customers.forEach(c => console.log(`  - ${c.company_name || c.name} (${c.contact_person})`));

    // Check employees
    const employees = await prisma.employee.findMany({
      take: 5,
      select: {
        id: true,
        employee_id: true,
        first_name: true,
        last_name: true,
        email: true,
        status: true
      }
    });
    console.log(`\nEmployees (${employees.length}):`);
    employees.forEach(e => console.log(`  - ${e.first_name} ${e.last_name} (${e.employee_id})`));

    // Check locations
    const locations = await prisma.location.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        is_active: true
      }
    });
    console.log(`\nLocations (${locations.length}):`);
    locations.forEach(l => console.log(`  - ${l.name} (${l.city}, ${l.state})`));

    console.log('\n=== Data Check Complete ===');
  } catch (error) {
    console.error('Error checking existing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingData(); 