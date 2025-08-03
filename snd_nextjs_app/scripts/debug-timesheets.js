import { prisma } from '@/lib/db';
const { PrismaClient } = require('@prisma/client');

async function debugTimesheets() {
  try {
    console.log('=== Debugging Timesheets ===');

    // Check if employee exists
    const employee = await prisma.employee.findFirst({
      where: {
        id: 'cmdmu42ex0002cnfw0l9xeorp'
      }
    });

    console.log('Employee found:', employee ? 'YES' : 'NO');
    if (employee) {
      console.log('Employee name:', `${employee.firstName} ${employee.lastName}`);
    }

    // Check all timesheets
    const allTimesheets = await prisma.timesheet.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Total timesheets in database:', allTimesheets.length);
    console.log('Sample timesheets:');
    allTimesheets.forEach((ts, index) => {
      console.log(`${index + 1}. ID: ${ts.id}, Employee: ${ts.employeeId}, Date: ${ts.date}, Hours: ${ts.hoursWorked}, Overtime: ${ts.overtimeHours}, Status: ${ts.status}`);
    });

    // Check timesheets for specific employee
    const employeeTimesheets = await prisma.timesheet.findMany({
      where: {
        employeeId: 'cmdmu42ex0002cnfw0l9xeorp'
      },
      orderBy: {
        date: 'desc'
      }
    });

    console.log('\nTimesheets for employee cmdmu42ex0002cnfw0l9xeorp:', employeeTimesheets.length);
    employeeTimesheets.forEach((ts, index) => {
      console.log(`${index + 1}. Date: ${ts.date}, Hours: ${ts.hoursWorked}, Overtime: ${ts.overtimeHours}, Status: ${ts.status}`);
    });

    // Check current month filter
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    console.log('\nCurrent month filter:');
    console.log('Start date:', startDate);
    console.log('End date:', endDate);

    const currentMonthTimesheets = await prisma.timesheet.findMany({
      where: {
        employeeId: 'cmdmu42ex0002cnfw0l9xeorp',
        date: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      }
    });

    console.log('Timesheets for current month:', currentMonthTimesheets.length);

  } catch (error) {
    console.error('Error debugging timesheets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTimesheets();
