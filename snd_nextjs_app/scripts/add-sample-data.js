const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addSampleData() {
  try {
    console.log('🔍 Adding sample timesheet and leave data...');
    
    const employeeId = 1;
    
    // Add sample timesheets
    const timesheets = await Promise.all([
      prisma.timesheet.create({
        data: {
          employee_id: employeeId,
          date: new Date('2024-01-15'),
          hours_worked: 8,
          status: 'approved',
          created_at: new Date(),
          updated_at: new Date()
        }
      }),
      prisma.timesheet.create({
        data: {
          employee_id: employeeId,
          date: new Date('2024-01-16'),
          hours_worked: 7.5,
          status: 'approved',
          created_at: new Date(),
          updated_at: new Date()
        }
      }),
      prisma.timesheet.create({
        data: {
          employee_id: employeeId,
          date: new Date('2024-01-17'),
          hours_worked: 8,
          status: 'pending',
          created_at: new Date(),
          updated_at: new Date()
        }
      })
    ]);
    
    console.log('✅ Created timesheets:', timesheets.length);
    
    // Add sample leave requests
    const leaves = await Promise.all([
      prisma.leave.create({
        data: {
          employee_id: employeeId,
          start_date: new Date('2024-02-01'),
          end_date: new Date('2024-02-03'),
          leave_type: 'Annual Leave',
          status: 'approved',
          created_at: new Date(),
          updated_at: new Date()
        }
      }),
      prisma.leave.create({
        data: {
          employee_id: employeeId,
          start_date: new Date('2024-03-15'),
          end_date: new Date('2024-03-16'),
          leave_type: 'Sick Leave',
          status: 'pending',
          created_at: new Date(),
          updated_at: new Date()
        }
      })
    ]);
    
    console.log('✅ Created leave requests:', leaves.length);
    
    console.log('✅ Sample data added successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSampleData();
