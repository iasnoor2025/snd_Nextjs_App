const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEmployeeLeaves() {
  try {
    console.log('🔍 Checking employee leave data...');
    
    // Check employee leaves
    const totalEmployeeLeaves = await prisma.employeeLeave.count();
    console.log('Total employee leaves:', totalEmployeeLeaves);
    
    if (totalEmployeeLeaves > 0) {
      const sampleLeaves = await prisma.employeeLeave.findMany({
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
      console.log('Sample employee leaves:', JSON.stringify(sampleLeaves, null, 2));
    }
    
    // Check time off requests
    const totalTimeOffRequests = await prisma.timeOffRequest.count();
    console.log('Total time off requests:', totalTimeOffRequests);
    
    if (totalTimeOffRequests > 0) {
      const sampleTimeOff = await prisma.timeOffRequest.findMany({
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
      console.log('Sample time off requests:', JSON.stringify(sampleTimeOff, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmployeeLeaves();
