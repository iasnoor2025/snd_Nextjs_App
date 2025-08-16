import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { timesheets } from '@/lib/drizzle/schema';
import { and, eq } from 'drizzle-orm';
export async function $1(_request: NextRequest) {
  try {
    const body = await request.json();
    const { assignments } = body;

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json(
        { error: 'No assignments provided' },
        { status: 400 }
      );
    }

    const created: any[] = [];

    for (const assignment of assignments) {
      const {
        employee_id,
        assignment_id,
        date_from,
        date_to,
        project_id,
        rental_id,
        hours_worked,
        overtime_hours,
        description,
        tasks,
        start_time,
        end_time,
        daily_hours
      } = assignment;

      // Validate required fields
      if (!employee_id || !date_from || !date_to) {
        continue;
      }

      // Generate date range
      const dates = getDateRange(date_from, date_to);

      for (const date of dates) {
        // Get specific hours for this date if available
        let normalHours = parseFloat(hours_worked || '8');
        let overtimeHours = parseFloat(overtime_hours || '0');

        if (daily_hours && daily_hours[date]) {
          normalHours = parseFloat(daily_hours[date].normal || '0');
          overtimeHours = parseFloat(daily_hours[date].overtime || '0');
        }

        // Skip if no hours
        if (normalHours === 0 && overtimeHours === 0) {
          continue;
        }

        // Check for existing timesheet
        const existingTimesheet = await db
          .select({ id: timesheets.id })
          .from(timesheets)
          .where(
            and(
              eq(timesheets.employeeId, employee_id),
              eq(timesheets.date, new Date(date).toISOString())
            )
          )
          .limit(1);

        if (existingTimesheet) {
          continue; // Skip if timesheet already exists
        }

        // Create timesheet
        await db.insert(timesheets).values({
          employeeId: employee_id,
          assignmentId: assignment_id || null,
          projectId: project_id || null,
          rentalId: rental_id || null,
          date: new Date(date).toISOString(),
          hoursWorked: String(normalHours),
          overtimeHours: String(overtimeHours),
          description: description || null,
          tasks: tasks || null,
          status: 'draft',
          startTime: start_time ? new Date(start_time).toISOString() : new Date().toISOString(),
          endTime: end_time ? new Date(end_time).toISOString() : null,
          updatedAt: new Date().toISOString(),
        });

        created.push({ employee_id, date });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Timesheets created successfully',
      count: created.length,
    });
  } catch (error) {
    console.error('Error creating bulk timesheets:', error);
    return NextResponse.json(
      { error: 'Failed to create bulk timesheets' },
      { status: 500 }
    );
  }
}

// Helper function to get date range
function getDateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const current = new Date(from);
  const end = new Date(to);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}
