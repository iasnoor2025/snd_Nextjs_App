const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEmployeeAssignments() {
  console.log('🧪 Testing Employee Assignments with All Types...\n');

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

    // 2. Check if we have any rentals
    const rentals = await prisma.rental.findMany({
      take: 1,
      include: {
        customer: true,
      },
    });

    if (rentals.length === 0) {
      console.log('❌ No rentals found. Please create a rental first.');
      return;
    }

    const rental = rentals[0];
    console.log(`📋 Found rental: ${rental.rental_number} (Customer: ${rental.customer?.name || 'Unknown'})`);

    // 3. Check if we have any projects
    const projects = await prisma.project.findMany({
      take: 1,
    });

    if (projects.length === 0) {
      console.log('❌ No projects found. Please create a project first.');
      return;
    }

    const project = projects[0];
    console.log(`🏗️ Found project: ${project.name} (ID: ${project.id})`);

    // 4. Create test assignments of different types
    console.log('\n🔧 Creating test assignments...');

    // Manual assignment
    const manualAssignment = await prisma.employeeAssignment.create({
      data: {
        employee_id: employee.id,
        name: 'Test Manual Assignment',
        type: 'manual',
        location: 'Test Location',
        start_date: new Date(),
        end_date: null,
        status: 'active',
        notes: 'Test manual assignment',
        project_id: null,
        rental_id: null,
      },
    });

    console.log(`✅ Created manual assignment: ${manualAssignment.id}`);

    // Project assignment
    const projectAssignment = await prisma.employeeAssignment.create({
      data: {
        employee_id: employee.id,
        name: 'Test Project Assignment',
        type: 'project',
        location: 'Project Site',
        start_date: new Date(),
        end_date: null,
        status: 'active',
        notes: 'Test project assignment',
        project_id: project.id,
        rental_id: null,
      },
    });

    console.log(`✅ Created project assignment: ${projectAssignment.id}`);

    // Rental assignment
    const rentalAssignment = await prisma.employeeAssignment.create({
      data: {
        employee_id: employee.id,
        name: 'Test Rental Assignment',
        type: 'rental_item',
        location: 'Rental Site',
        start_date: new Date(),
        end_date: null,
        status: 'active',
        notes: 'Test rental assignment',
        project_id: null,
        rental_id: rental.id,
      },
    });

    console.log(`✅ Created rental assignment: ${rentalAssignment.id}`);

    // 5. Fetch all assignments for the employee
    console.log('\n📊 Fetching all assignments...');
    const allAssignments = await prisma.employeeAssignment.findMany({
      where: { employee_id: employee.id },
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
            rental_number: true,
            customer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    console.log(`📊 Total assignments found: ${allAssignments.length}`);

    // 6. Display assignment details
    console.log('\n📝 Assignment Details:');
    allAssignments.forEach((assignment, index) => {
      console.log(`\n${index + 1}. ${assignment.name} (ID: ${assignment.id})`);
      console.log(`   Type: ${assignment.type}`);
      console.log(`   Status: ${assignment.status}`);
      console.log(`   Location: ${assignment.location || 'N/A'}`);
      console.log(`   Start Date: ${assignment.start_date.toISOString().slice(0, 10)}`);
      console.log(`   End Date: ${assignment.end_date?.toISOString().slice(0, 10) || 'N/A'}`);
      
      if (assignment.project) {
        console.log(`   Project: ${assignment.project.name} (ID: ${assignment.project.id})`);
      }
      
      if (assignment.rental) {
        console.log(`   Rental: ${assignment.rental.rental_number} (Customer: ${assignment.rental.customer?.name || 'Unknown'})`);
      }
      
      if (assignment.notes) {
        console.log(`   Notes: ${assignment.notes}`);
      }
    });

    // 7. Test API endpoint
    console.log('\n🌐 Testing API endpoint...');
    const apiUrl = `http://localhost:3000/api/employees/${employee.id}/assignments`;
    console.log(`API URL: ${apiUrl}`);
    console.log('💡 You can test the API endpoint manually by visiting the employee detail page.');

    // 8. Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await prisma.employeeAssignment.deleteMany({
      where: {
        employee_id: employee.id,
        notes: {
          contains: 'Test',
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
testEmployeeAssignments(); 