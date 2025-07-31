import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assignments } = body;

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json(
        { error: 'No assignments provided' },
        { status: 400 }
      );
    }

    const created = [];

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
        const existingTimesheet = await prisma.timesheet.findFirst({
          where: {
            employee_id: employee_id,
            date: new Date(date),
            ...(project_id && { project_id: project_id }),
            ...(rental_id && { rental_id: rental_id }),
          },
        });

        if (existingTimesheet) {
          continue; // Skip if timesheet already exists
        }

        // Create timesheet
        const timesheet = await prisma.timesheet.create({
          data: {
            employee_id: employee_id,
            assignment_id: assignment_id || null,
            project_id: project_id || null,
            rental_id: rental_id || null,
            date: new Date(date),
            hours_worked: normalHours,
            overtime_hours: overtimeHours,
            description: description || null,
            tasks: tasks || null,
            status: 'draft',
            start_time: start_time ? new Date(start_time) : new Date(),
            end_time: end_time ? new Date(end_time) : null,
          },
        });

        created.push(timesheet);
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
  const dates = [];
  const current = new Date(from);
  const end = new Date(to);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}
