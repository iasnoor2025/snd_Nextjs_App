import { employeeAssignments, timesheets } from '@/lib/drizzle/schema';
import { isNull, sql } from 'drizzle-orm';
import { db } from './drizzle';

// Global flag to prevent multiple simultaneous executions
let isAutoGenerating = false;

export interface AutoGenerateResult {
  success: boolean;
  created: number;
  errors: string[];
  message: string;
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
}

export async function autoGenerateTimesheets(): Promise<AutoGenerateResult> {
  // Check if already running
  if (isAutoGenerating) {
    return {
      success: false,
      created: 0,
      errors: ['Auto-generation already in progress'],
      message: 'Auto-generation already in progress',
    };
  }

  // Set flag
  isAutoGenerating = true;

  try {
    console.log('Starting timesheet auto-generation...');

    // Test database connection first with better error handling
    try {
      const testResult = await db.execute(sql`SELECT 1 as test`);
      console.log('Database connection test successful');
    } catch (dbError) {
              // Database connection failed
      return {
        success: false,
        created: 0,
        errors: [
          `Database connection failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
        ],
        message: 'Database connection failed',
      };
    }

    // Check environment variables
    // Environment check completed

    // Check existing timesheets count
    try {
      const existingTimesheetsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(timesheets)
        .where(isNull(timesheets.deletedAt));

      // Found existing timesheets
    } catch (countError) {
              // Could not count existing timesheets
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Auto-generating timesheets using assignment dates

    // Get all employee assignments regardless of status
    let assignments;
    try {
      assignments = await db
        .select({
          id: employeeAssignments.id,
          employee_id: employeeAssignments.employeeId,
          project_id: employeeAssignments.projectId,
          rental_id: employeeAssignments.rentalId,
          start_date: employeeAssignments.startDate,
          end_date: employeeAssignments.endDate,
          status: employeeAssignments.status,
        })
        .from(employeeAssignments);

      // Found assignments to process

      // Check if there are any assignments to process
      if (assignments.length === 0) {
        return {
          success: true,
          created: 0,
          errors: ['No employee assignments found to process'],
          message: 'No employee assignments found to process',
        };
      }

      // Assignment validation completed
    } catch (queryError) {
      return {
        success: false,
        created: 0,
        errors: [
          `Failed to fetch assignments: ${queryError instanceof Error ? queryError.message : 'Unknown error'}`,
        ],
        message: 'Failed to fetch assignments',
      };
    }

    let created = 0;
    const errors: string[] = [];
    const totalAssignments = assignments.length;
    let processedAssignments = 0;

    for (const assignment of assignments) {
      processedAssignments++;
      // Processing assignment

      try {
        const employeeId = assignment.employee_id;

        // Validate assignment data
        if (!assignment.id || typeof assignment.id !== 'number') {
          errors.push(`Assignment ${assignment.id}: invalid ID`);
          continue;
        }

        if (!assignment.employee_id || typeof assignment.employee_id !== 'number') {
          errors.push(`Assignment ${assignment.id}: invalid employee ID`);
          continue;
        }

        if (!assignment.start_date) {
          errors.push(`Assignment ${assignment.id}: missing start date`);
          continue;
        }

        // Validate start date format and convert to local date
        const startDate = new Date(assignment.start_date);
        if (isNaN(startDate.getTime())) {
          errors.push(`Assignment ${assignment.id}: invalid start date format`);
          continue;
        }

        // Convert to local date (remove timezone offset)
        const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

        // Determine the effective end date
        let effectiveEnd = today; // Default to today

        if (assignment.end_date) {
          const assignmentEndDate = new Date(assignment.end_date);
          // Validate end date format
          if (isNaN(assignmentEndDate.getTime())) {
            errors.push(`Assignment ${assignment.id}: invalid end date format`);
            continue;
          }

          // Convert to local date (remove timezone offset)
          const assignmentEnd = new Date(
            assignmentEndDate.getFullYear(),
            assignmentEndDate.getMonth(),
            assignmentEndDate.getDate()
          );

          // If assignment end date is in the future, use today instead
          if (assignmentEnd > today) {
            effectiveEnd = today;
          } else {
            effectiveEnd = assignmentEnd;
          }
        }
        // If no end date, use today

        // If start is after effective end, skip
        if (start > effectiveEnd) {
          errors.push(`Assignment ${assignment.id}: start date after end date`);
          continue;
        }

        // Use assignment start date directly (no 3-month calculation)
        const effectiveStart = start;

        // Log assignment details for debugging
        console.log(`Processing assignment ${assignment.id}:`, {
          employeeId,
          startDate: effectiveStart.toDateString(),
          effectiveEnd: effectiveEnd.toDateString(),
        });

        // Generate timesheets for each day in the period
        const currentDate = new Date(effectiveStart);
        let assignmentCreated = 0;
        let loopCount = 0;
        const maxLoopCount = 1000; // Safety check to prevent infinite loops

        console.log(`Starting timesheet generation for assignment ${assignment.id}:`);
        console.log(`  - Start date: ${effectiveStart.toDateString()}`);
        console.log(`  - End date: ${effectiveEnd.toDateString()}`);
        console.log(`  - Current date: ${currentDate.toDateString()}`);

        while (currentDate <= effectiveEnd && loopCount < maxLoopCount) {
          loopCount++;
          try {
            // Create a proper timestamp for the database (timestamp without time zone)
            // Use raw SQL to avoid JavaScript timezone conversion issues
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;

            console.log(`  - Processing date: ${dateString} (loop ${loopCount})`);

            // Check for existing timesheet using raw SQL to avoid timezone issues
            const existingTimesheets = await db.execute(sql`
              SELECT id, employee_id, date, status 
              FROM timesheets 
              WHERE employee_id = ${employeeId} 
                AND DATE(date) = ${dateString}
                AND deleted_at IS NULL
            `);

            console.log(`  - Existing timesheets found: ${existingTimesheets.rows?.length || 0}`);

            if (existingTimesheets.rows && existingTimesheets.rows.length > 0) {
              // Skip if timesheet already exists
              console.log(`  - Skipping ${dateString} - timesheet already exists`);
              currentDate.setDate(currentDate.getDate() + 1);
              continue;
            }

            // Determine work hours based on day of week (Friday is rest day)
            const dayOfWeek = currentDate.getDay();
            let hoursWorked = 8;
            let overtimeHours = 0;

            if (dayOfWeek === 5) {
              // Friday (0 = Sunday, 5 = Friday)
              // Friday: rest day (no work)
              hoursWorked = 0;
              overtimeHours = 0;
            } else {
              // Saturday–Thursday: regular workday
              hoursWorked = 8;
              overtimeHours = 0;
            }

            // Create the timesheet using raw SQL to avoid timezone issues
            try {

              await db.execute(sql`
                INSERT INTO timesheets (
                  employee_id, date, status, hours_worked, overtime_hours, 
                  start_time, end_time, assignment_id, project_id, rental_id, 
                  created_at, updated_at
                ) VALUES (
                  ${employeeId}, ${dateString}::date, 'draft', 
                  ${hoursWorked.toString()}, ${overtimeHours.toString()},
                  ${dateString}::date + INTERVAL '6 hours',
                  ${dateString}::date + INTERVAL '16 hours',
                  ${assignment.id}, ${assignment.project_id || null}, ${assignment.rental_id || null},
                  NOW(), NOW()
                )
              `);


              created++;
              assignmentCreated++;
            } catch (insertError) {
              console.error(`Error creating timesheet for ${dateString}:`, insertError);

              // Check for specific database errors
              if (insertError instanceof Error) {
                const errorMessage = insertError.message;
                if (errorMessage.includes('foreign key')) {
                  errors.push(
                    `Foreign key constraint violation for assignment ${assignment.id}: ${errorMessage}`
                  );
                } else if (errorMessage.includes('unique constraint')) {
                  errors.push(
                    `Unique constraint violation for assignment ${assignment.id}: ${errorMessage}`
                  );
                } else if (errorMessage.includes('not null')) {
                  errors.push(
                    `Not null constraint violation for assignment ${assignment.id}: ${errorMessage}`
                  );
                } else if (errorMessage.includes('invalid input')) {
                  errors.push(
                    `Invalid input data for assignment ${assignment.id}: ${errorMessage}`
                  );
                } else {
                  errors.push(`Database error for assignment ${assignment.id}: ${errorMessage}`);
                }
              } else {
                errors.push(`Unknown database error for assignment ${assignment.id}`);
              }
            }

            // Always increment the date to prevent infinite loops
            currentDate.setDate(currentDate.getDate() + 1);
          } catch (timesheetError) {
            console.error(
              `Failed to process timesheet for assignment ${assignment.id} on ${currentDate.toDateString()}: ${timesheetError instanceof Error ? timesheetError.message : 'Unknown error'}`
            );
            errors.push(
              `Failed to process timesheet for assignment ${assignment.id} on ${currentDate.toDateString()}: ${timesheetError instanceof Error ? timesheetError.message : 'Unknown error'}`
            );
            // Always increment the date to prevent infinite loops
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }

        // Check if we hit the safety limit
        if (loopCount >= maxLoopCount) {
          errors.push(
            `Assignment ${assignment.id}: Loop limit exceeded (${maxLoopCount}), possible infinite loop detected`
          );
        }

      } catch (assignmentError) {
        console.error(`Error processing assignment ${assignment.id}:`, assignmentError);
        errors.push(
          `Failed to process assignment ${assignment.id}: ${assignmentError instanceof Error ? assignmentError.message : 'Unknown error'}`
        );
      }
    }

    const progress = {
      current: processedAssignments,
      total: totalAssignments,
      percentage:
        totalAssignments > 0 ? Math.round((processedAssignments / totalAssignments) * 100) : 0,
    };

    return {
      success: true,
      created,
      errors,
      message: `Auto-generation completed. Created: ${created} timesheets using assignment start and end dates`,
      progress,
    };
  } catch (error) {
    console.error('Auto-generation error:', error);
    return {
      success: false,
      created: 0,
      errors: [
        `Failed to auto-generate timesheets: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
      message: 'Auto-generation failed',
    };
  } finally {
    // Reset flag
    isAutoGenerating = false;
  }
}
