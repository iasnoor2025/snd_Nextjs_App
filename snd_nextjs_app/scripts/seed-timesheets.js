const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedTimesheets() {
  try {
    // Use the specific employee ID from the URL
    const employeeId = 'cmdmu42ex0002cnfw0l9xeorp';

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      console.log('Employee not found. Available employees:');
      const allEmployees = await prisma.employee.findMany();
      allEmployees.forEach(emp => {
        console.log(`- ${emp.id}: ${emp.firstName} ${emp.lastName}`);
      });
      return;
    }

    console.log(`Seeding timesheets for employee: ${employee.firstName} ${employee.lastName} (${employee.id})`);

    // Create sample timesheets for the current month (December 2024)
    const currentDate = new Date();
    const currentMonth = 11; // December (0-based)
    const currentYear = 2024;

    const timesheets = [];

    // Create timesheets for the last 10 working days of December 2024
    for (let i = 0; i < 10; i++) {
      const date = new Date(currentYear, currentMonth, 31 - i); // Start from December 31st

      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      const startTime = '08:00';
      const endTime = '17:00';
      const regularHours = 8;
      const overtimeHours = Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0;

      timesheets.push({
        employeeId: employeeId,
        date: date,
        startTime: startTime,
        endTime: endTime,
        hoursWorked: regularHours,
        overtimeHours: overtimeHours,
        status: 'manager_approved',
        description: `Work day ${i + 1}`,
        notes: `Regular work day with ${overtimeHours} hours overtime`,
      });
    }

    console.log(`Creating ${timesheets.length} timesheets for December 2024...`);

    // Insert the timesheets
    for (const timesheet of timesheets) {
      const created = await prisma.timesheet.create({
        data: timesheet,
      });
      console.log(`Created timesheet: ${created.id} for date ${created.date}`);
    }

    console.log(`Successfully created ${timesheets.length} timesheets`);

    // Verify the timesheets were created
    const createdTimesheets = await prisma.timesheet.findMany({
      where: { employeeId: employeeId },
      orderBy: { date: 'desc' }
    });

    console.log(`Verification: Found ${createdTimesheets.length} timesheets for employee ${employeeId}`);

  } catch (error) {
    console.error('Error seeding timesheets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTimesheets();
