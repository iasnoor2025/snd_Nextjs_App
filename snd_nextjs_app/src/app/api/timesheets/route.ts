import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma, safePrismaOperation } from '@/lib/db';
import { withAuth } from '@/lib/rbac/api-middleware';
import { authConfig } from '@/lib/auth-config';

// GET /api/timesheets - List timesheets with employee data filtering
const getTimesheetsHandler = async (request: NextRequest) => {
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
      const timesheets = await safePrismaOperation(() => 
        prisma.timesheet.findMany({
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
        })
      );

      // Transform the response to match frontend interface
      const transformedTimesheets = timesheets.map(timesheet => ({
        id: timesheet.id.toString(),
        employeeId: timesheet.employee_id.toString(),
        date: timesheet.date.toISOString().split('T')[0],
        hoursWorked: timesheet.hours_worked,
        overtimeHours: timesheet.overtime_hours,
        startTime: timesheet.start_time?.toISOString() || '',
        endTime: timesheet.end_time?.toISOString() || '',
        status: timesheet.status,
        projectId: timesheet.project_id?.toString(),
        rentalId: timesheet.rental_id?.toString(),
        assignmentId: timesheet.assignment_id?.toString(),
        description: timesheet.description || '',
        tasksCompleted: timesheet.tasks || '',
        submittedAt: timesheet.submitted_at?.toISOString() || '',
        approvedBy: timesheet.approved_by_user?.name || '',
        approvedAt: timesheet.approved_at?.toISOString() || '',
        createdAt: timesheet.created_at.toISOString(),
        updatedAt: timesheet.updated_at.toISOString(),
        employee: {
          id: timesheet.employee.id.toString(),
          firstName: timesheet.employee.first_name,
          lastName: timesheet.employee.last_name,
          employeeId: timesheet.employee.employee_id,
          user: timesheet.employee.user ? {
            name: timesheet.employee.user.name,
            email: timesheet.employee.user.email,
          } : undefined,
        },
        project: timesheet.project_rel ? {
          id: timesheet.project_rel.id.toString(),
          name: timesheet.project_rel.name,
        } : undefined,
        rental: timesheet.rental ? {
          id: timesheet.rental.id.toString(),
          rentalNumber: timesheet.rental.rental_number,
        } : undefined,
        assignment: timesheet.assignment ? {
          id: timesheet.assignment.id.toString(),
          name: timesheet.assignment.name || '',
          type: timesheet.assignment.type,
        } : undefined,
      }));

      return NextResponse.json({
        data: transformedTimesheets,
        total: timesheets.length,
        message: 'Test access successful'
      });
    }

    const skip = (page - 1) * limit;

    const where: any = {
      deleted_at: null,
    };

    // Get session to check user role
    const session = await getServerSession(authConfig);
    const user = session?.user;
    
    // For employee users, only show their own timesheets
    if (user?.role === 'EMPLOYEE') {
      // Find employee record that matches user's national_id
      const ownEmployee = await safePrismaOperation(() => 
        prisma.employee.findFirst({
          where: { iqama_number: user.national_id },
          select: { id: true },
        })
      );
      if (ownEmployee) {
        where.employee_id = ownEmployee.id;
      }
    }

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

    // Transform the response to match frontend interface
    const transformedTimesheets = timesheets.map(timesheet => ({
      id: timesheet.id.toString(),
      employeeId: timesheet.employee_id.toString(),
      date: timesheet.date.toISOString().split('T')[0],
      hoursWorked: timesheet.hours_worked,
      overtimeHours: timesheet.overtime_hours,
      startTime: timesheet.start_time?.toISOString() || '',
      endTime: timesheet.end_time?.toISOString() || '',
      status: timesheet.status,
      projectId: timesheet.project_id?.toString(),
      rentalId: timesheet.rental_id?.toString(),
      assignmentId: timesheet.assignment_id?.toString(),
      description: timesheet.description || '',
      tasksCompleted: timesheet.tasks || '',
      submittedAt: timesheet.submitted_at?.toISOString() || '',
      approvedBy: timesheet.approved_by_user?.name || '',
      approvedAt: timesheet.approved_at?.toISOString() || '',
      createdAt: timesheet.created_at.toISOString(),
      updatedAt: timesheet.updated_at.toISOString(),
      employee: {
        id: timesheet.employee.id.toString(),
        firstName: timesheet.employee.first_name,
        lastName: timesheet.employee.last_name,
        employeeId: timesheet.employee.employee_id,
        user: timesheet.employee.user ? {
          name: timesheet.employee.user.name,
          email: timesheet.employee.user.email,
        } : undefined,
      },
      project: timesheet.project_rel ? {
        id: timesheet.project_rel.id.toString(),
        name: timesheet.project_rel.name,
      } : undefined,
      rental: timesheet.rental ? {
        id: timesheet.rental.id.toString(),
        rentalNumber: timesheet.rental.rental_number,
      } : undefined,
      assignment: timesheet.assignment ? {
        id: timesheet.assignment.id.toString(),
        name: timesheet.assignment.name || '',
        type: timesheet.assignment.type,
      } : undefined,
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: transformedTimesheets,
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
};

// GET /api/timesheets - List timesheets with permission check
export const GET = withAuth(
  getTimesheetsHandler
);

// POST /api/timesheets - Create timesheet with permission check
export const POST = withAuth(
  async (request: NextRequest) => {
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
          employee_id: employeeId,
          date: new Date(date),
          hours_worked: parseFloat(hoursWorked || '0'),
          overtime_hours: parseFloat(overtimeHours || '0'),
          start_time: startTime ? new Date(startTime) : new Date(),
          end_time: endTime ? new Date(endTime) : null,
          status: status || 'draft',
          project_id: projectId || null,
          rental_id: rentalId || null,
          assignment_id: assignmentId || null,
          description,
          tasks: tasksCompleted,
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
);

// PUT /api/timesheets - Update timesheet with permission check
export const PUT = withAuth(
  async (request: NextRequest) => {
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
          employee_id: employeeId,
          date: new Date(date),
          hours_worked: parseFloat(hoursWorked || '0'),
          overtime_hours: parseFloat(overtimeHours || '0'),
          start_time: startTime ? new Date(startTime) : new Date(),
          end_time: endTime ? new Date(endTime) : null,
          status,
          project_id: projectId || null,
          rental_id: rentalId || null,
          assignment_id: assignmentId || null,
          description,
          tasks: tasksCompleted,
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
);

// DELETE /api/timesheets - Delete timesheet with permission check
export const DELETE = withAuth(
  async (request: NextRequest) => {
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
);
