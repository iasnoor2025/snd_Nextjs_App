const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAssignmentStatusManagement() {
  console.log('🧪 Testing Assignment Status Management...\n');

  try {
    // 1. Check if we have any employees
    const employees = await prisma.employee.findMany({
      take: 1,
    });

    if (employees.length === 0) {
      console.log('❌ No employees found. Please create an employee first.');
      return;
    }

    const employee = employees[0];
    console.log(`👤 Found employee: ${employee.first_name} ${employee.last_name} (ID: ${employee.id})`);

    // 2. Clean up any existing test assignments
    await prisma.employeeAssignment.deleteMany({
      where: {
        employee_id: employee.id,
        notes: {
          contains: 'Test Status',
        },
      },
    });

    // 3. Create test assignments with different dates
    console.log('\n🔧 Creating test assignments with different dates...');

    const baseDate = new Date();
    const yesterday = new Date(baseDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(baseDate);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const tomorrow = new Date(baseDate);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Assignment 1: Started 2 days ago
    const assignment1 = await prisma.employeeAssignment.create({
      data: {
        employee_id: employee.id,
        name: 'Test Assignment 1 (2 days ago)',
        type: 'manual',
        location: 'Location 1',
        start_date: twoDaysAgo,
        end_date: null,
        status: 'active',
        notes: 'Test Status Management - Assignment 1',
        project_id: null,
        rental_id: null,
      },
    });

    // Assignment 2: Started yesterday
    const assignment2 = await prisma.employeeAssignment.create({
      data: {
        employee_id: employee.id,
        name: 'Test Assignment 2 (yesterday)',
        type: 'manual',
        location: 'Location 2',
        start_date: yesterday,
        end_date: null,
        status: 'active',
        notes: 'Test Status Management - Assignment 2',
        project_id: null,
        rental_id: null,
      },
    });

    // Assignment 3: Started today
    const assignment3 = await prisma.employeeAssignment.create({
      data: {
        employee_id: employee.id,
        name: 'Test Assignment 3 (today)',
        type: 'manual',
        location: 'Location 3',
        start_date: baseDate,
        end_date: null,
        status: 'active',
        notes: 'Test Status Management - Assignment 3',
        project_id: null,
        rental_id: null,
      },
    });

    // Assignment 4: Starts tomorrow
    const assignment4 = await prisma.employeeAssignment.create({
      data: {
        employee_id: employee.id,
        name: 'Test Assignment 4 (tomorrow)',
        type: 'manual',
        location: 'Location 4',
        start_date: tomorrow,
        end_date: null,
        status: 'active',
        notes: 'Test Status Management - Assignment 4',
        project_id: null,
        rental_id: null,
      },
    });

    console.log('✅ Created 4 test assignments with different dates');

    // 4. Show initial state
    console.log('\n📊 Initial Assignment State:');
    const initialAssignments = await prisma.employeeAssignment.findMany({
      where: {
        employee_id: employee.id,
        notes: {
          contains: 'Test Status',
        },
      },
      orderBy: { start_date: 'asc' },
    });

    initialAssignments.forEach((assignment, index) => {
      console.log(`${index + 1}. ${assignment.name}`);
      console.log(`   Start: ${assignment.start_date.toISOString().slice(0, 10)}`);
      console.log(`   End: ${assignment.end_date?.toISOString().slice(0, 10) || 'null'}`);
      console.log(`   Status: ${assignment.status}`);
    });

    // 5. Simulate the assignment status management logic
    console.log('\n🔧 Running Assignment Status Management...');

    // Get all assignments ordered by start date
    const allAssignments = await prisma.employeeAssignment.findMany({
      where: {
        employee_id: employee.id,
        notes: {
          contains: 'Test Status',
        },
      },
      orderBy: [
        { start_date: 'asc' },
        { id: 'asc' }
      ]
    });

    // Find the current assignment (latest start date)
    const currentAssignment = allAssignments.reduce((latest, current) => {
      const latestDate = latest.start_date ? new Date(latest.start_date) : new Date(0);
      const currentDate = current.start_date ? new Date(current.start_date) : new Date(0);
      return currentDate > latestDate ? current : latest;
    });

    console.log(`\n🎯 Current Assignment: ${currentAssignment.name} (${currentAssignment.start_date.toISOString().slice(0, 10)})`);

    // Update assignments based on their position
    for (let i = 0; i < allAssignments.length; i++) {
      const assignment = allAssignments[i];
      const isCurrent = assignment.id === currentAssignment.id;

      console.log(`\n📝 Processing: ${assignment.name}`);
      console.log(`   Is Current: ${isCurrent}`);

      if (isCurrent) {
        // Current assignment should be active with no end date
        if (assignment.status !== 'active' || assignment.end_date !== null) {
          console.log(`   🔄 Updating to: active, end_date: null`);
          await prisma.employeeAssignment.update({
            where: { id: assignment.id },
            data: {
              status: 'active',
              end_date: null
            }
          });
        } else {
          console.log(`   ✅ Already correct`);
        }
      } else {
        // Find the next assignment after this one
        let nextAssignment = null;
        for (let j = i + 1; j < allAssignments.length; j++) {
          if (allAssignments[j].start_date > assignment.start_date) {
            nextAssignment = allAssignments[j];
            break;
          }
        }

        let endDate;
        if (nextAssignment) {
          // Set end date to day before next assignment starts
          endDate = new Date(nextAssignment.start_date);
          endDate.setDate(endDate.getDate() - 1);
          console.log(`   🔄 Updating to: completed, end_date: ${endDate.toISOString().slice(0, 10)} (day before ${nextAssignment.name})`);
        } else {
          // Set end date to day before current assignment starts
          endDate = new Date(currentAssignment.start_date);
          endDate.setDate(endDate.getDate() - 1);
          console.log(`   🔄 Updating to: completed, end_date: ${endDate.toISOString().slice(0, 10)} (day before current assignment)`);
        }

        await prisma.employeeAssignment.update({
          where: { id: assignment.id },
          data: {
            status: 'completed',
            end_date: endDate
          }
        });
      }
    }

    // 6. Show final state
    console.log('\n📊 Final Assignment State:');
    const finalAssignments = await prisma.employeeAssignment.findMany({
      where: {
        employee_id: employee.id,
        notes: {
          contains: 'Test Status',
        },
      },
      orderBy: { start_date: 'asc' },
    });

    finalAssignments.forEach((assignment, index) => {
      console.log(`${index + 1}. ${assignment.name}`);
      console.log(`   Start: ${assignment.start_date.toISOString().slice(0, 10)}`);
      console.log(`   End: ${assignment.end_date?.toISOString().slice(0, 10) || 'null'}`);
      console.log(`   Status: ${assignment.status}`);
    });

    // 7. Clean up
    console.log('\n🧹 Cleaning up test data...');
    await prisma.employeeAssignment.deleteMany({
      where: {
        employee_id: employee.id,
        notes: {
          contains: 'Test Status',
        },
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
testAssignmentStatusManagement(); 