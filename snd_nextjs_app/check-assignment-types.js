const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllAssignmentTypes() {
  try {
    console.log('=== Checking All Assignment Types ===\n');

    // Get all assignments (including deleted ones for analysis)
    const allAssignments = await prisma.employeeAssignment.findMany({
      include: {
        employee: true,
        project: true,
        rental: true,
      },
    });

    console.log(`Total assignments found: ${allAssignments.length}\n`);

    // Group by type
    const assignmentsByType = {};
    allAssignments.forEach(assignment => {
      if (!assignmentsByType[assignment.type]) {
        assignmentsByType[assignment.type] = [];
      }
      assignmentsByType[assignment.type].push(assignment);
    });

    console.log('Assignments by type:');
    Object.keys(assignmentsByType).forEach(type => {
      console.log(`\n${type.toUpperCase()} assignments (${assignmentsByType[type].length}):`);
      assignmentsByType[type].forEach((assignment, index) => {
        console.log(`  ${index + 1}. Employee: ${assignment.employee.firstName} ${assignment.employee.lastName}`);
        console.log(`     Status: ${assignment.status}`);
        console.log(`     Start: ${assignment.startDate}`);
        console.log(`     End: ${assignment.endDate || 'No end date'}`);
        console.log(`     Project: ${assignment.project?.name || 'N/A'}`);
        console.log(`     Rental: ${assignment.rental?.rentalNumber || 'N/A'}`);
        console.log(`     Deleted: ${assignment.deletedAt ? 'Yes' : 'No'}`);
      });
    });

    // Check active assignments only
    console.log('\n=== Active Assignments Only ===');
    const activeAssignments = allAssignments.filter(a => !a.deletedAt && a.status === 'active');
    console.log(`Active assignments: ${activeAssignments.length}`);

    const activeByType = {};
    activeAssignments.forEach(assignment => {
      if (!activeByType[assignment.type]) {
        activeByType[assignment.type] = [];
      }
      activeByType[assignment.type].push(assignment);
    });

    Object.keys(activeByType).forEach(type => {
      console.log(`\n${type.toUpperCase()} active assignments (${activeByType[type].length}):`);
      activeByType[type].forEach((assignment, index) => {
        console.log(`  ${index + 1}. Employee: ${assignment.employee.firstName} ${assignment.employee.lastName}`);
        console.log(`     Start: ${assignment.startDate}`);
        console.log(`     End: ${assignment.endDate || 'No end date'}`);
        console.log(`     Project: ${assignment.project?.name || 'N/A'}`);
        console.log(`     Rental: ${assignment.rental?.rentalNumber || 'N/A'}`);
      });
    });

    // Test auto-generation for each type
    console.log('\n=== Testing Auto-Generation for Each Type ===');

    for (const [type, assignments] of Object.entries(activeByType)) {
      if (assignments.length > 0) {
        console.log(`\nTesting ${type.toUpperCase()} assignments:`);

        for (const assignment of assignments) {
          console.log(`\n  Assignment: ${assignment.employee.firstName} ${assignment.employee.lastName}`);
          console.log(`  Type: ${assignment.type}`);
          console.log(`  Start: ${assignment.startDate}`);
          console.log(`  End: ${assignment.endDate || 'No end date'}`);

          // Check existing timesheets for this assignment
          const existingTimesheets = await prisma.timesheet.findMany({
            where: {
              employeeId: assignment.employeeId,
              assignmentId: assignment.id,
              deletedAt: null,
            },
            orderBy: {
              date: 'desc',
            },
            take: 5,
          });

          console.log(`  Existing timesheets: ${existingTimesheets.length}`);
          if (existingTimesheets.length > 0) {
            console.log(`  Sample timesheets:`);
            existingTimesheets.slice(0, 3).forEach(ts => {
              console.log(`    - ${ts.date}: ${ts.hoursWorked}h, ${ts.status}`);
            });
          }
        }
      }
    }

    // Test the auto-generation logic for each type
    console.log('\n=== Testing Auto-Generation Logic ===');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const assignment of activeAssignments) {
      console.log(`\nTesting assignment ${assignment.id} (${assignment.type}):`);
      console.log(`  Employee: ${assignment.employee.firstName} ${assignment.employee.lastName}`);

      if (!assignment.startDate) {
        console.log(`  ❌ Missing start date - will be skipped`);
        continue;
      }

      const start = new Date(assignment.startDate);
      const end = assignment.endDate ? new Date(assignment.endDate) : today;

      if (start > end) {
        console.log(`  ❌ Start date after end date - will be skipped`);
        continue;
      }

      console.log(`  ✅ Valid date range: ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`);

      // Check what would be generated
      const currentDate = new Date(start);
      let daysToGenerate = 0;
      let daysToSkip = 0;

      while (currentDate <= end) {
        const existingTimesheet = await prisma.timesheet.findFirst({
          where: {
            employeeId: assignment.employeeId,
            date: currentDate,
            deletedAt: null,
          },
        });

        if (existingTimesheet) {
          daysToSkip++;
        } else {
          daysToGenerate++;
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log(`  📊 Would generate: ${daysToGenerate} timesheets, Skip: ${daysToSkip} (already exist)`);

      // Check assignment-specific details
      if (assignment.type === 'project' && assignment.projectId) {
        console.log(`  🏗️  Project assignment: ${assignment.project?.name || 'Unknown project'}`);
      } else if (assignment.type === 'rental' && assignment.rentalId) {
        console.log(`  🚛 Rental assignment: ${assignment.rental?.rentalNumber || 'Unknown rental'}`);
      } else if (assignment.type === 'manual') {
        console.log(`  📝 Manual assignment: ${assignment.name || 'No name'}`);
      } else {
        console.log(`  ❓ Unknown assignment type: ${assignment.type}`);
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Total assignments: ${allAssignments.length}`);
    console.log(`Active assignments: ${activeAssignments.length}`);
    console.log(`Assignment types found: ${Object.keys(assignmentsByType).join(', ')}`);
    console.log(`Active assignment types: ${Object.keys(activeByType).join(', ')}`);

  } catch (error) {
    console.error('Error checking assignment types:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkAllAssignmentTypes();
