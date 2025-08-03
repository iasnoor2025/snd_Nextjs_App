import { prisma } from '@/lib/db';
const { PrismaClient } = require('@prisma/client');

async function checkTimesheetStatuses() {
  try {
    console.log('🔍 CHECKING TIMESHEET STATUSES...');
    
    // Get all timesheets with their statuses
    const timesheets = await prisma.timesheet.findMany({
      select: {
        id: true,
        status: true,
        date: true,
        employee: {
          select: {
            first_name: true,
            last_name: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 20
    });

    console.log('🔍 TIMESHEET STATUSES:');
    timesheets.forEach(t => {
      console.log(`  ID: ${t.id}, Status: "${t.status}", Date: ${t.date}, Employee: ${t.employee.first_name} ${t.employee.last_name}`);
    });

    // Group by status
    const statusCounts = timesheets.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});

    console.log('\n🔍 STATUS COUNTS:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  "${status}": ${count} timesheets`);
    });

    // Check if any statuses are not in our approval workflow
    const approvalWorkflowStatuses = ['pending', 'draft', 'submitted', 'foreman_approved', 'incharge_approved', 'checking_approved'];
    const unknownStatuses = timesheets.filter(t => !approvalWorkflowStatuses.includes(t.status));
    
    if (unknownStatuses.length > 0) {
      console.log('\n🔍 UNKNOWN STATUSES (not in approval workflow):');
      unknownStatuses.forEach(t => {
        console.log(`  ID: ${t.id}, Status: "${t.status}"`);
      });
    } else {
      console.log('\n✅ All statuses are in the approval workflow');
    }

  } catch (error) {
    console.error('❌ Error checking timesheet statuses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTimesheetStatuses(); 