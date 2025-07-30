const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestAssignments() {
  try {
    console.log('🌱 Creating test assignments...');

    // Create test assignments for employee ID 1 (John Doe)
    const assignment1 = await prisma.employeeAssignment.upsert({
      where: { 
        id: 1 
      },
      update: {},
      create: {
        employee_id: 1,
        name: 'Riyadh Project Assignment',
        type: 'manual',
        location: 'Riyadh, Saudi Arabia',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-06-30'),
        status: 'completed',
        notes: 'Main project assignment for the first half of the year',
      },
    });

    const assignment2 = await prisma.employeeAssignment.upsert({
      where: { 
        id: 2 
      },
      update: {},
      create: {
        employee_id: 1,
        name: 'Jeddah Site Assignment',
        type: 'manual',
        location: 'Jeddah, Saudi Arabia',
        start_date: new Date('2024-07-01'),
        end_date: null,
        status: 'active',
        notes: 'Current active assignment for site operations',
      },
    });

    const assignment3 = await prisma.employeeAssignment.upsert({
      where: { 
        id: 3 
      },
      update: {},
      create: {
        employee_id: 2,
        name: 'Dammam Operations',
        type: 'manual',
        location: 'Dammam, Saudi Arabia',
        start_date: new Date('2024-03-01'),
        end_date: new Date('2024-05-31'),
        status: 'completed',
        notes: 'Temporary assignment for operations support',
      },
    });

    console.log('✅ Test assignments created successfully!');
    console.log('Assignment 1:', assignment1.name);
    console.log('Assignment 2:', assignment2.name);
    console.log('Assignment 3:', assignment3.name);
  } catch (error) {
    console.error('❌ Error creating test assignments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestAssignments(); 