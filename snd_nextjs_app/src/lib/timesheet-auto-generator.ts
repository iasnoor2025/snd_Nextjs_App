import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AutoGenerateResult {
  success: boolean;
  created: number;
  errors: string[];
  message: string;
}

export async function autoGenerateTimesheets(): Promise<AutoGenerateResult> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all employee assignments (all statuses, not just active)
    const assignments = await prisma.employeeAssignment.findMany({
      where: {
        deletedAt: null,
        // Remove status filter to include all statuses: active, completed, pending, etc.
      },
      include: {
        employee: true,
        project: true,
        rental: true,
      },
    });

    let created = 0;
    const errors: string[] = [];

    for (const assignment of assignments) {
      const employeeId = assignment.employeeId;

      if (!assignment.startDate) {
        errors.push(`Assignment ${assignment.id}: missing start date`);
        continue;
      }

      const start = new Date(assignment.startDate);
      // Use assignment end date if set, otherwise use today
      const end = assignment.endDate ? new Date(assignment.endDate) : today;

      // If start is after end, skip
      if (start > end) {
        errors.push(`Assignment ${assignment.id}: start date after end date`);
        continue;
      }

      // Generate timesheets for each day in the period
      const currentDate = new Date(start);
      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];

        // Check for existing timesheet with comprehensive duplicate detection
        const projectId = assignment.type === 'project' ? assignment.projectId : null;
        const rentalId = assignment.type === 'rental' ? assignment.rentalId : null;

        // Check for any existing timesheet for this employee on this date
        const existingTimesheet = await prisma.timesheet.findFirst({
          where: {
            employeeId: employeeId,
            date: currentDate,
            deletedAt: null,
          },
        });

        if (existingTimesheet) {
          // Skip if timesheet already exists
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        // Determine work hours based on day of week (Friday is rest day)
        const dayOfWeek = currentDate.getDay();
        let hoursWorked = 8;
        let overtimeHours = 0;

        if (dayOfWeek === 5) { // Friday (0 = Sunday, 5 = Friday)
          // Friday: rest day (no work)
          hoursWorked = 0;
          overtimeHours = 0;
        } else {
          // Saturday–Thursday: regular workday
          hoursWorked = 8;
          overtimeHours = 0;
        }

        // Create timesheet data
        const timesheetData: any = {
          employeeId,
          date: currentDate,
          status: 'draft',
          hoursWorked,
          overtimeHours,
          startTime: '06:00',
          endTime: '16:00',
          assignmentId: assignment.id,
        };

        // Add project or rental assignment
        if (assignment.type === 'project' && assignment.projectId) {
          timesheetData.projectId = assignment.projectId;
        }
        if (assignment.type === 'rental' && assignment.rentalId) {
          timesheetData.rentalId = assignment.rentalId;
        }

        // Create the timesheet
        await prisma.timesheet.create({
          data: timesheetData,
        });

        created++;
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return {
      success: true,
      created,
      errors,
      message: `Auto-generation completed. Created: ${created} timesheets`,
    };
  } catch (error) {
    console.error('Error auto-generating timesheets:', error);
    return {
      success: false,
      created: 0,
      errors: ['Failed to auto-generate timesheets'],
      message: 'Auto-generation failed',
    };
  }
}
