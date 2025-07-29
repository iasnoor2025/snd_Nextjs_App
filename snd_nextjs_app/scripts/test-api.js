const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAPI() {
  try {
    console.log('=== Testing Timesheets API Logic ===');

    const employeeId = 'cmdmu42ex0002cnfw0l9xeorp';
    const month = '2024-12';

    console.log('Testing with employeeId:', employeeId);
    console.log('Testing with month:', month);

    // Parse month
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59);

    console.log('Start date:', startDate);
    console.log('End date:', endDate);

    // Test the same query as the API
    const timesheets = await prisma.timesheet.findMany({
      where: {
        employeeId: employeeId,
        deletedAt: null,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        rental: {
          select: {
            id: true,
            rentalNumber: true,
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        assignment: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    console.log('Found timesheets:', timesheets.length);
    timesheets.forEach((ts, index) => {
      console.log(`${index + 1}. Date: ${ts.date}, Hours: ${ts.hoursWorked}, Overtime: ${ts.overtimeHours}, Status: ${ts.status}`);
    });

  } catch (error) {
    console.error('Error testing API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAPI();
