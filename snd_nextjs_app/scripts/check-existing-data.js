const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkExistingData() {
  try {
    console.log('🔍 Checking existing timesheets and leave data...');
    
    // Check timesheets
    const totalTimesheets = await prisma.timesheet.count();
    console.log('Total timesheets:', totalTimesheets);
    
    if (totalTimesheets > 0) {
      const sampleTimesheets = await prisma.timesheet.findMany({
        take: 5,
        include: {
          employee: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              employee_id: true
            }
          }
        }
      });
      console.log('Sample timesheets:', JSON.stringify(sampleTimesheets, null, 2));
    }
    
    // Check leave requests (TimeOffRequest)
    const totalLeaves = await prisma.timeOffRequest.count();
    console.log('Total leave requests:', totalLeaves);
    
    if (totalLeaves > 0) {
      const sampleLeaves = await prisma.timeOffRequest.findMany({
        take: 5,
        include: {
          employee: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              employee_id: true
            }
          }
        }
      });
      console.log('Sample leave requests:', JSON.stringify(sampleLeaves, null, 2));
    }
    
    // Check projects
    const totalProjects = await prisma.project.count();
    console.log('Total projects:', totalProjects);
    
    if (totalProjects > 0) {
      const sampleProjects = await prisma.project.findMany({
        take: 5
      });
      console.log('Sample projects:', JSON.stringify(sampleProjects, null, 2));
    }
    
    // Check project assignments
    const totalProjectAssignments = await prisma.projectResource.count();
    console.log('Total project assignments:', totalProjectAssignments);
    
    if (totalProjectAssignments > 0) {
      const sampleAssignments = await prisma.projectResource.findMany({
        take: 5,
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          },
          employee: {
            select: {
              id: true,
              first_name: true,
              last_name: true
            }
          }
        }
      });
      console.log('Sample project assignments:', JSON.stringify(sampleAssignments, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingData(); 