import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { timesheets, employees, projects, rentals, employeeAssignments, users } from '@/lib/drizzle/schema';
import { eq, gte, lte, asc } from 'drizzle-orm';

export async function GET(
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

    if (!employeeId) {
      return NextResponse.json(
        { error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    // Get date range parameters if provided
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Build where clause
    let whereClause = eq(timesheets.employeeId, employeeId);
    if (startDate && endDate) {
      whereClause = eq(timesheets.employeeId, employeeId);
      // Note: Drizzle doesn't support complex date range queries in the same way
      // We'll filter in JavaScript for now
    }

    // Fetch real timesheet data from database using Drizzle
    const timesheetsRows = await db
      .select({
        id: timesheets.id,
        date: timesheets.date,
        startTime: timesheets.startTime,
        endTime: timesheets.endTime,
        hoursWorked: timesheets.hoursWorked,
        overtimeHours: timesheets.overtimeHours,
        status: timesheets.status,
        description: timesheets.description,
        tasks: timesheets.tasks,
        projectId: timesheets.projectId,
        rentalId: timesheets.rentalId,
        assignmentId: timesheets.assignmentId,
        approvedBy: timesheets.approvedBy,
        submittedAt: timesheets.submittedAt,
        approvedAt: timesheets.approvedAt,
        createdAt: timesheets.createdAt,
        updatedAt: timesheets.updatedAt,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
        },
        project: {
          id: projects.id,
          name: projects.name,
        },
        rental: {
          id: rentals.id,
          rentalNumber: rentals.rentalNumber,
        },
        assignment: {
          id: employeeAssignments.id,
          name: employeeAssignments.name,
          type: employeeAssignments.type,
        },
        approvedByUser: {
          id: users.id,
          name: users.name,
        },
      })
      .from(timesheets)
      .leftJoin(employees, eq(timesheets.employeeId, employees.id))
      .leftJoin(projects, eq(timesheets.projectId, projects.id))
      .leftJoin(rentals, eq(timesheets.rentalId, rentals.id))
      .leftJoin(employeeAssignments, eq(timesheets.assignmentId, employeeAssignments.id))
      .leftJoin(users, eq(timesheets.approvedBy, users.id))
      .where(whereClause)
      .orderBy(asc(timesheets.date));

    console.log('🔍 Timesheets API - Total timesheets found for employee:', timesheetsRows.length);
    if (timesheetsRows.length > 0) {
      console.log('🔍 Timesheets API - Sample timesheet dates:', timesheetsRows.slice(0, 3).map(t => t.date));
    }

    // Filter by date range if provided
    let filteredTimesheets = timesheetsRows;
    if (startDate && endDate) {
      console.log('🔍 Timesheets API - Filtering by date range:', startDate, 'to', endDate);
      filteredTimesheets = timesheetsRows.filter(timesheet => {
        const timesheetDate = new Date(timesheet.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        const isInRange = timesheetDate >= start && timesheetDate <= end;
        console.log('🔍 Timesheets API - Timesheet date:', timesheet.date, 'In range:', isInRange);
        return isInRange;
      });
      console.log('🔍 Timesheets API - After date filtering:', filteredTimesheets.length);
    }

    // Transform the data to match the expected format
    const formattedTimesheets = filteredTimesheets.map(timesheet => ({
      id: timesheet.id,
      date: timesheet.date,
      clock_in: timesheet.startTime ? timesheet.startTime.slice(11, 16) : null,
      clock_out: timesheet.endTime ? timesheet.endTime.slice(11, 16) : null,
      regular_hours: Number(timesheet.hoursWorked) || 0,
      overtime_hours: Number(timesheet.overtimeHours) || 0,
      status: timesheet.status,
      description: timesheet.description,
      tasks: timesheet.tasks,
      project: timesheet.project,
      rental: timesheet.rental,
      assignment: timesheet.assignment,
      approved_by: timesheet.approvedByUser,
      submitted_at: timesheet.submittedAt,
      approved_at: timesheet.approvedAt,
      created_at: timesheet.createdAt,
      updated_at: timesheet.updatedAt,
    }));

    console.log('🔍 Timesheets API - Raw data count:', filteredTimesheets.length);
    console.log('🔍 Timesheets API - Formatted data count:', formattedTimesheets.length);
    if (formattedTimesheets.length > 0) {
      console.log('🔍 Timesheets API - Sample formatted timesheet:', formattedTimesheets[0]);
    }

    return NextResponse.json({
      success: true,
      data: formattedTimesheets,
      message: 'Timesheets retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /api/employees/[id]/timesheets:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch timesheets: ' + (error as Error).message
      },
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
