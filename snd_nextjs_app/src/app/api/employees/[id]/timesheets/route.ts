import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { timesheets, employees, projects, rentals, employeeAssignments, users } from '@/lib/drizzle/schema';
import { eq, gte, lte, asc, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const employeeId = parseInt(id);
    if (isNaN(employeeId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid employee ID' },
        { status: 400 }
      );
    }

    // Fetch timesheets for the employee within the date range
    const timesheetRows = await db
      .select({
        id: timesheets.id,
        date: timesheets.date,
        clockIn: timesheets.startTime,
        clockOut: timesheets.endTime,
        hoursWorked: timesheets.hoursWorked,
        overtimeHours: timesheets.overtimeHours,
        status: timesheets.status,
        description: timesheets.description,
        tasks: timesheets.tasks,
        project: timesheets.projectId,
        rental: timesheets.rentalId,
        assignment: {
          id: employeeAssignments.id,
          name: employeeAssignments.name,
          type: employeeAssignments.type
        },
        approvedBy: {
          id: users.id,
          name: users.name
        },
        submittedAt: timesheets.submittedAt,
        approvedAt: timesheets.approvedAt,
        createdAt: timesheets.createdAt,
        updatedAt: timesheets.updatedAt
      })
      .from(timesheets)
      .leftJoin(employeeAssignments, eq(timesheets.assignmentId, employeeAssignments.id))
      .leftJoin(users, eq(timesheets.approvedBy, users.id))
      .where(
        and(
          eq(timesheets.employeeId, employeeId),
          gte(timesheets.date, startDate),
          lte(timesheets.date, endDate)
        )
      )
      .orderBy(asc(timesheets.date));

    // Format the response
    const formattedTimesheets = timesheetRows.map(timesheet => ({
      id: timesheet.id,
      date: timesheet.date,
      clock_in: timesheet.clockIn,
      clock_out: timesheet.clockOut,
      regular_hours: Number(timesheet.hoursWorked) || 0,
      overtime_hours: Number(timesheet.overtimeHours) || 0,
      status: timesheet.status,
      description: timesheet.description,
      tasks: timesheet.tasks,
      project: timesheet.project,
      rental: timesheet.rental,
      assignment: timesheet.assignment,
      approved_by: timesheet.approvedBy,
      submitted_at: timesheet.submittedAt,
      approved_at: timesheet.approvedAt,
      created_at: timesheet.createdAt,
      updated_at: timesheet.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: formattedTimesheets,
      message: 'Timesheets retrieved successfully'
    });

  } catch (error) {
    console.error('Error in GET /api/employees/[id]/timesheets:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const employeeId = parseInt(id);
    const body = await request.json();

    if (!employeeId) {
      return NextResponse.json(
        { error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    // Create real timesheet in database using Drizzle
    const timesheetRows = await db.insert(timesheets).values({
      employeeId: employeeId,
      date: new Date(body.date).toISOString(),
      startTime: body.start_time ? new Date(`2000-01-01T${body.start_time}`).toISOString() : new Date(body.date).toISOString(),
      endTime: body.end_time ? new Date(`2000-01-01T${body.end_time}`).toISOString() : null,
      hoursWorked: parseFloat(body.hours_worked || 0).toString(),
      overtimeHours: parseFloat(body.overtime_hours || 0).toString(),
      status: body.status || 'draft',
      description: body.description || '',
      tasks: body.tasks || '',
      projectId: body.project_id || null,
      rentalId: body.rental_id || null,
      assignmentId: body.assignment_id || null,
      submittedAt: body.status === 'submitted' ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning();

    const timesheet = timesheetRows[0];

    return NextResponse.json({
      success: true,
      message: 'Timesheet created successfully',
      data: {
        id: timesheet.id,
        employee_id: timesheet.employeeId,
        date: timesheet.date,
        start_time: timesheet.startTime ? timesheet.startTime.slice(11, 16) : null,
        end_time: timesheet.endTime ? timesheet.endTime.slice(11, 16) : null,
        hours_worked: timesheet.hoursWorked,
        overtime_hours: timesheet.overtimeHours,
        status: timesheet.status,
        description: timesheet.description,
        tasks: timesheet.tasks,
        created_at: timesheet.createdAt,
      }
    });
  } catch (error) {
    console.error('Error in POST /api/employees/[id]/timesheets:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create timesheet: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}
