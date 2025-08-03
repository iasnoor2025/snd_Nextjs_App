import { prisma } from '@/lib/db';
const { PrismaClient } = require('@prisma/client');

async function testRentalOperatorAssignment() {
  console.log('🧪 Testing Rental Operator Assignment Functionality...\n');

  try {
    // 1. Check if we have any rentals
    const rentals = await prisma.rental.findMany({
      take: 1,
      include: {
        customer: true,
        rental_items: true,
      },
    });

    if (rentals.length === 0) {
      console.log('❌ No rentals found. Please create a rental first.');
      return;
    }

    const rental = rentals[0];
    console.log(`📋 Found rental: ${rental.rental_number} (Customer: ${rental.customer?.name || 'Unknown'})`);

    // 2. Check if we have any employees
    const employees = await prisma.employee.findMany({
      take: 1,
      where: {
        is_operator: true,
      },
    });

    if (employees.length === 0) {
      console.log('❌ No operator employees found. Please create an operator employee first.');
      return;
    }

    const employee = employees[0];
    console.log(`👤 Found operator: ${employee.first_name} ${employee.last_name} (ID: ${employee.id})`);

    // 3. Check current employee assignments
    const currentAssignments = await prisma.employeeAssignment.findMany({
      where: {
        employee_id: employee.id,
        rental_id: rental.id,
        type: 'rental_item',
      },
    });

    console.log(`📊 Current assignments for this operator on this rental: ${currentAssignments.length}`);

    // 4. Test creating a rental item with operator
    console.log('\n🔧 Testing rental item creation with operator...');
    
    const testRentalItem = await prisma.rentalItem.create({
      data: {
        rental_id: rental.id,
        equipment_name: 'Test Equipment',
        quantity: 1,
        unit_price: 100.00,
        total_price: 100.00,
        days: 1,
        rate_type: 'daily',
        operator_id: employee.id,
        status: 'active',
        notes: 'Test rental item for operator assignment',
      },
    });

    console.log(`✅ Created rental item: ${testRentalItem.id}`);

    // 5. Check if employee assignment was created
    const newAssignments = await prisma.employeeAssignment.findMany({
      where: {
        employee_id: employee.id,
        rental_id: rental.id,
        type: 'rental_item',
      },
    });

    console.log(`📊 Employee assignments after rental item creation: ${newAssignments.length}`);

    if (newAssignments.length > currentAssignments.length) {
      console.log('✅ Employee assignment was created successfully!');
      console.log('📝 Assignment details:', {
        id: newAssignments[0].id,
        name: newAssignments[0].name,
        type: newAssignments[0].type,
        status: newAssignments[0].status,
        start_date: newAssignments[0].start_date,
      });
    } else {
      console.log('❌ Employee assignment was not created automatically.');
      console.log('💡 This means the API endpoint needs to be called to create the assignment.');
    }

    // 6. Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await prisma.rentalItem.delete({
      where: { id: testRentalItem.id },
    });

    // Also clean up any test assignments
    await prisma.employeeAssignment.deleteMany({
      where: {
        employee_id: employee.id,
        rental_id: rental.id,
        type: 'rental_item',
        notes: 'Test rental item for operator assignment',
      },
    });

    console.log('✅ Test data cleaned up.');

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRentalOperatorAssignment(); 