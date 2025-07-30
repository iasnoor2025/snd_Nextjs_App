import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const project = searchParams.get('project') || '';
    const month = searchParams.get('month') || '';
    const employeeId = searchParams.get('employeeId') || '';
    const test = searchParams.get('test') || '';

    // Allow test access without authentication
    if (test === 'true') {
      const timesheets = await prisma.timesheet.findMany({
        take: 5,
        include: {
          employee: {
            include: {
              user: true,
            },
          },
          project_rel: true,
          rental: true,
          assignment: true,
          approved_by_user: true,
        },
      });

      return NextResponse.json({
        data: timesheets,
        total: timesheets.length,
        message: 'Test access successful'
      });
    }

    const skip = (page - 1) * limit;

    const where: any = {
      deleted_at: null,
    };

    if (search) {
      where.OR = [
        { employee: { first_name: { contains: search, mode: 'insensitive' } } },
        { employee: { last_name: { contains: search, mode: 'insensitive' } } },
        { employee: { employee_id: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (month) {
      // Parse month filter (format: YYYY-MM)
      const [year, monthNum] = month.split('-');
      if (year && monthNum) {
        const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(monthNum), 0);

        where.date = {
          gte: startDate,
          lte: endDate,
        };
      }
    }

    if (employeeId) {
      where.employee_id = employeeId;
    }

    const [timesheets, total] = await Promise.all([
      prisma.timesheet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          employee: {
            include: {
              user: true,
            },
          },
          project_rel: true,
          rental: true,
          assignment: true,
          approved_by_user: true,
        },
      }),
      prisma.timesheet.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: timesheets,
      current_page: page,
      last_page: totalPages,
      per_page: limit,
      total,
      next_page_url: page < totalPages ? `/api/timesheets?page=${page + 1}` : null,
      prev_page_url: page > 1 ? `/api/timesheets?page=${page - 1}` : null,
    });
  } catch (error) {
    console.error('Error fetching timesheets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timesheets', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle both Laravel-style and Next.js-style field names
    const employeeId = body.employee_id || body.employeeId;
    const date = body.date;
    const hoursWorked = body.hours_worked || body.hoursWorked;
    const overtimeHours = body.overtime_hours || body.overtimeHours;
    const startTime = body.start_time || body.startTime;
    const endTime = body.end_time || body.endTime;
    const status = body.status;
    const projectId = body.project_id || body.projectId;
    const rentalId = body.rental_id || body.rentalId;
    const assignmentId = body.assignment_id || body.assignmentId;
    const description = body.description;
    const tasksCompleted = body.tasks_completed || body.tasksCompleted;
    const notes = body.notes;

    const timesheet = await prisma.timesheet.create({
      data: {
        employeeId,
        date: new Date(date),
        hoursWorked: parseFloat(hoursWorked || '0'),
        overtimeHours: parseFloat(overtimeHours || '0'),
        startTime: startTime || '08:00',
        endTime,
        status: status || 'draft',
        projectId: projectId || null,
        rentalId: rentalId || null,
        assignmentId: assignmentId || null,
        description,
        tasksCompleted,
        notes,
      },
    });

    return NextResponse.json(timesheet, { status: 201 });
  } catch (error) {
    console.error('Error creating timesheet:', error);
    return NextResponse.json(
      { error: 'Failed to create timesheet', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      employeeId,
      date,
      hoursWorked,
      overtimeHours,
      startTime,
      endTime,
      status,
      projectId,
      rentalId,
      assignmentId,
      description,
      tasksCompleted,
      notes,
    } = body;

    const timesheet = await prisma.timesheet.update({
      where: { id },
      data: {
        employeeId,
        date: new Date(date),
        hoursWorked: parseFloat(hoursWorked || '0'),
        overtimeHours: parseFloat(overtimeHours || '0'),
        startTime: startTime || '08:00',
        endTime,
        status,
        projectId: projectId || null,
        rentalId: rentalId || null,
        assignmentId: assignmentId || null,
        description,
        tasksCompleted,
        notes,
      },
    });

    return NextResponse.json(timesheet);
  } catch (error) {
    console.error('Error updating timesheet:', error);
    return NextResponse.json(
      { error: 'Failed to update timesheet', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    await prisma.timesheet.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Timesheet deleted successfully' });
  } catch (error) {
    console.error('Error deleting timesheet:', error);
    return NextResponse.json(
      { error: 'Failed to delete timesheet', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
