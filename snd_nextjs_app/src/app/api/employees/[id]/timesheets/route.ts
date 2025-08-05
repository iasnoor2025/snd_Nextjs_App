import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

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
    const whereClause: any = { employee_id: employeeId };
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Fetch real timesheet data from database
    const timesheets = await prisma.timesheet.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            employee_id: true,
          },
        },
        project_rel: {
          select: {
            id: true,
            name: true,
          },
        },
        rental: {
          select: {
            id: true,
            rental_number: true,
          },
        },
        assignment: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        approved_by_user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    // Transform the data to match the expected format
    const formattedTimesheets = timesheets.map(timesheet => ({
      id: timesheet.id,
      date: timesheet.date.toISOString().split('T')[0],
      clock_in: timesheet.start_time?.toISOString().slice(11, 16) || null,
      clock_out: timesheet.end_time?.toISOString().slice(11, 16) || null,
      regular_hours: timesheet.hours_worked,
      overtime_hours: timesheet.overtime_hours,
      status: timesheet.status,
      description: timesheet.description,
      tasks: timesheet.tasks,
      project: timesheet.project_rel,
      rental: timesheet.rental,
      assignment: timesheet.assignment,
      approved_by: timesheet.approved_by_user,
      submitted_at: timesheet.submitted_at?.toISOString() || null,
      approved_at: timesheet.approved_at?.toISOString() || null,
      created_at: timesheet.created_at.toISOString(),
      updated_at: timesheet.updated_at.toISOString(),
    }));

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

    // Create real timesheet in database
    const timesheet = await prisma.timesheet.create({
      data: {
        employee_id: employeeId,
        date: new Date(body.date),
        start_time: body.start_time ? new Date(`2000-01-01T${body.start_time}`) : null,
        end_time: body.end_time ? new Date(`2000-01-01T${body.end_time}`) : null,
        hours_worked: parseFloat(body.hours_worked || 0),
        overtime_hours: parseFloat(body.overtime_hours || 0),
        status: body.status || 'draft',
        description: body.description || '',
        tasks: body.tasks || '',
        project_id: body.project_id || null,
        rental_id: body.rental_id || null,
        assignment_id: body.assignment_id || null,
        submitted_at: body.status === 'submitted' ? new Date() : null,
      },
      include: {
        employee: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            employee_id: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Timesheet created successfully',
      data: {
        id: timesheet.id,
        employee_id: timesheet.employee_id,
        date: timesheet.date.toISOString().split('T')[0],
        start_time: timesheet.start_time?.toISOString().slice(11, 16) || null,
        end_time: timesheet.end_time?.toISOString().slice(11, 16) || null,
        hours_worked: timesheet.hours_worked,
        overtime_hours: timesheet.overtime_hours,
        status: timesheet.status,
        description: timesheet.description,
        tasks: timesheet.tasks,
        created_at: timesheet.created_at.toISOString(),
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
