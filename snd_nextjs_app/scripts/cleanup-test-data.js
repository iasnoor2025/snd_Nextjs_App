import { prisma } from '@/lib/db';
const { PrismaClient } = require('@prisma/client');

async function cleanupTestData() {
  try {
    console.log('🧹 Starting cleanup of all test data...');

    // Delete test customers
    const customerResult = await prisma.customer.deleteMany({
      where: {
        OR: [
          { erpnext_id: { startsWith: 'TEST-' } },
          { name: { contains: 'Test' } },
          { company_name: { contains: 'Test' } },
          { erpnext_id: 'Sinopec International Petroleum Service' }
        ]
      }
    });

    console.log(`✅ Deleted ${customerResult.count} test customers`);

    // Delete test employees (if any)
    const employeeResult = await prisma.employee.deleteMany({
      where: {
        OR: [
          { employee_id: { startsWith: 'TEST-' } },
          { first_name: { contains: 'Test' } },
          { last_name: { contains: 'Test' } }
        ]
      }
    });

    console.log(`✅ Deleted ${employeeResult.count} test employees`);

    // Delete test equipment (if any)
    const equipmentResult = await prisma.equipment.deleteMany({
      where: {
        OR: [
          { name: { contains: 'Test' } },
          { erpnext_id: { startsWith: 'TEST-' } }
        ]
      }
    });

    console.log(`✅ Deleted ${equipmentResult.count} test equipment`);

    // Delete test rentals (if any)
    const rentalResult = await prisma.rental.deleteMany({
      where: {
        OR: [
          { rental_number: { startsWith: 'TEST-' } },
          { description: { contains: 'Test' } }
        ]
      }
    });

    console.log(`✅ Deleted ${rentalResult.count} test rentals`);

    // Delete test projects (if any)
    const projectResult = await prisma.project.deleteMany({
      where: {
        OR: [
          { name: { contains: 'Test' } },
          { description: { contains: 'Test' } }
        ]
      }
    });

    console.log(`✅ Deleted ${projectResult.count} test projects`);

    // Delete test timesheets (if any)
    const timesheetResult = await prisma.timesheet.deleteMany({
      where: {
        OR: [
          { notes: { contains: 'Test' } },
          { project: { contains: 'Test' } }
        ]
      }
    });

    console.log(`✅ Deleted ${timesheetResult.count} test timesheets`);

    // Delete test payrolls (if any)
    const payrollResult = await prisma.payroll.deleteMany({
      where: {
        OR: [
          { notes: { contains: 'Test' } }
        ]
      }
    });

    console.log(`✅ Deleted ${payrollResult.count} test payrolls`);

    const totalDeleted = customerResult.count + employeeResult.count + equipmentResult.count + 
                        rentalResult.count + projectResult.count + timesheetResult.count + payrollResult.count;

    console.log(`\n🎉 Cleanup completed successfully!`);
    console.log(`📊 Total records deleted: ${totalDeleted}`);
    console.log(`   - Customers: ${customerResult.count}`);
    console.log(`   - Employees: ${employeeResult.count}`);
    console.log(`   - Equipment: ${equipmentResult.count}`);
    console.log(`   - Rentals: ${rentalResult.count}`);
    console.log(`   - Projects: ${projectResult.count}`);
    console.log(`   - Timesheets: ${timesheetResult.count}`);
    console.log(`   - Payrolls: ${payrollResult.count}`);

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupTestData(); 