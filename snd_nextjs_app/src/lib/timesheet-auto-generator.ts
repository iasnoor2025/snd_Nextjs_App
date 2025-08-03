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

    // Calculate start date as 3 months ago
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    threeMonthsAgo.setHours(0, 0, 0, 0);

    // Get all employee assignments regardless of status
    const assignments = await prisma.employeeAssignment.findMany({
      where: {
        // Remove status filter to include all assignments: active, completed, pending, etc.
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
      const employeeId = assignment.employee_id;

      if (!assignment.start_date) {
        errors.push(`Assignment ${assignment.id}: missing start date`);
        continue;
      }

      const start = new Date(assignment.start_date);
      // Use assignment end date if set, otherwise use today (never future dates)
      const end = assignment.end_date ? new Date(assignment.end_date) : today;
      
      // If assignment end date is in the future, use today instead
      if (end > today) {
        end.setTime(today.getTime());
      }

      // If start is after end, skip
      if (start > end) {
        errors.push(`Assignment ${assignment.id}: start date after end date`);
        continue;
      }

      // Only generate timesheets for the last 3 months up to today
      const effectiveStart = start > threeMonthsAgo ? start : threeMonthsAgo;
      const effectiveEnd = end < today ? end : today;

      // If effective start is after effective end, skip
      if (effectiveStart > effectiveEnd) {
        continue;
      }

      // Generate timesheets for each day in the period
      const currentDate = new Date(effectiveStart);
      while (currentDate <= effectiveEnd) {
        // Check for existing timesheet for this employee on this date
        const existingTimesheet = await prisma.timesheet.findFirst({
          where: {
            employee_id: employeeId,
            date: currentDate,
            deleted_at: null,
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

        // Create the timesheet
        await prisma.timesheet.create({
          data: {
            employee_id: employeeId,
            date: currentDate,
            status: 'draft',
            hours_worked: hoursWorked,
            overtime_hours: overtimeHours,
            start_time: new Date(currentDate.getTime() + 6 * 60 * 60 * 1000), // 6 AM
            end_time: new Date(currentDate.getTime() + 16 * 60 * 60 * 1000), // 4 PM
            assignment_id: assignment.id,
            project_id: assignment.project_id || null,
            rental_id: assignment.rental_id || null,
          },
        });

        created++;
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return {
      success: true,
      created,
      errors,
      message: `Auto-generation completed. Created: ${created} timesheets for the last 3 months`,
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
