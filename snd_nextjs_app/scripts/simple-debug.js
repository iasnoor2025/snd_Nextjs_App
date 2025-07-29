const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simpleDebug() {
  try {
    console.log('=== Simple Debug ===');

    // Test database connection
    console.log('Testing database connection...');

    // Get all employees
    const employees = await prisma.employee.findMany({
      take: 5
    });

    console.log('Employees found:', employees.length);
    employees.forEach((emp, index) => {
      console.log(`${index + 1}. ID: ${emp.id}, Name: ${emp.firstName} ${emp.lastName}`);
    });

    // Get all timesheets
    const timesheets = await prisma.timesheet.findMany({
      take: 5
    });

    console.log('Timesheets found:', timesheets.length);
    timesheets.forEach((ts, index) => {
      console.log(`${index + 1}. ID: ${ts.id}, Employee: ${ts.employeeId}, Date: ${ts.date}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleDebug();
