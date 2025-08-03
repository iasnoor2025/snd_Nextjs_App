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

    console.log(`Auto-generating timesheets from ${threeMonthsAgo.toDateString()} to ${today.toDateString()}`);

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

    console.log(`Found ${assignments.length} assignments to process`);

    let created = 0;
    const errors: string[] = [];

    for (const assignment of assignments) {
      const employeeId = assignment.employee_id;

      if (!assignment.start_date) {
        errors.push(`Assignment ${assignment.id}: missing start date`);
        continue;
      }

      const start = new Date(assignment.start_date);
      
      // Determine the effective end date
      let effectiveEnd = today; // Default to today
      
      if (assignment.end_date) {
        const assignmentEnd = new Date(assignment.end_date);
        // If assignment end date is in the future, use today instead
        if (assignmentEnd > today) {
          effectiveEnd = today;
        } else {
          effectiveEnd = assignmentEnd;
        }
      }
      // If no end date, use today (last 3 months)

      // If start is after effective end, skip
      if (start > effectiveEnd) {
        errors.push(`Assignment ${assignment.id}: start date after end date`);
        continue;
      }

      // Determine the effective start date
      let effectiveStart = start;
      
      // If start date is more than 3 months ago, use 3 months ago
      if (start < threeMonthsAgo) {
        effectiveStart = threeMonthsAgo;
      }
      // If start date is less than 3 months ago, use start date (already set above)

      // If effective start is after effective end, skip
      if (effectiveStart > effectiveEnd) {
        console.log(`Skipping assignment ${assignment.id}: effective start (${effectiveStart.toDateString()}) after effective end (${effectiveEnd.toDateString()})`);
        continue;
      }

      console.log(`Processing assignment ${assignment.id} for employee ${employeeId}: ${effectiveStart.toDateString()} to ${effectiveEnd.toDateString()}`);

      // Generate timesheets for each day in the period
      const currentDate = new Date(effectiveStart);
      let assignmentCreated = 0;
      
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
        assignmentCreated++;
        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (assignmentCreated > 0) {
        console.log(`Created ${assignmentCreated} timesheets for assignment ${assignment.id}`);
      }
    }

    console.log(`Auto-generation completed. Total created: ${created}, Errors: ${errors.length}`);

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
