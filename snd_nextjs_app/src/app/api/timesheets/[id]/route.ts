import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { timesheets, employees, users, projects, rentals, employeeAssignments } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      hoursWorked,
      overtimeHours,
      status,
      description,
      tasksCompleted,
    } = body;

    // Validate required fields
    if (hoursWorked === undefined || overtimeHours === undefined) {
      return NextResponse.json(
        { error: 'Hours worked and overtime hours are required' },
        { status: 400 }
      );
    }

    // Update the timesheet using Drizzle
    const [updatedTimesheet] = await db
      .update(timesheets)
      .set({
        hoursWorked: parseFloat(hoursWorked),
        overtimeHours: parseFloat(overtimeHours),
        ...(status && { status }),
        ...(description && { description }),
        ...(tasksCompleted && { tasks: tasksCompleted }),
        updatedAt: new Date(),
      })
      .where(eq(timesheets.id, parseInt(id)))
      .returning();

    // Fetch the updated timesheet with related data
    const [timesheetWithDetails] = await db
      .select({
        id: timesheets.id,
        employeeId: timesheets.employeeId,
        date: timesheets.date,
        hoursWorked: timesheets.hoursWorked,
        overtimeHours: timesheets.overtimeHours,
        startTime: timesheets.startTime,
        endTime: timesheets.endTime,
        status: timesheets.status,
        projectId: timesheets.projectId,
        rentalId: timesheets.rentalId,
        assignmentId: timesheets.assignmentId,
        description: timesheets.description,
        tasks: timesheets.tasks,
        submittedAt: timesheets.submittedAt,
        approvedBy: timesheets.approvedBy,
        approvedAt: timesheets.approvedAt,
        createdAt: timesheets.createdAt,
        updatedAt: timesheets.updatedAt,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
          userId: employees.userId,
        },
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
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
          assignmentType: employeeAssignments.assignmentType,
        },
      })
      .from(timesheets)
      .leftJoin(employees, eq(timesheets.employeeId, employees.id))
      .leftJoin(users, eq(employees.userId, users.id))
      .leftJoin(projects, eq(timesheets.projectId, projects.id))
      .leftJoin(rentals, eq(timesheets.rentalId, rentals.id))
      .leftJoin(employeeAssignments, eq(timesheets.assignmentId, employeeAssignments.id))
      .where(eq(timesheets.id, parseInt(id)))
      .limit(1);

    // Transform the response to match frontend interface
    const transformedTimesheet = {
      id: timesheetWithDetails.id.toString(),
      employeeId: timesheetWithDetails.employeeId.toString(),
      date: timesheetWithDetails.date.toISOString().split('T')[0],
      hoursWorked: timesheetWithDetails.hoursWorked,
      overtimeHours: timesheetWithDetails.overtimeHours,
      startTime: timesheetWithDetails.startTime?.toISOString() || '',
      endTime: timesheetWithDetails.endTime?.toISOString() || '',
      status: timesheetWithDetails.status,
      projectId: timesheetWithDetails.projectId?.toString(),
      rentalId: timesheetWithDetails.rentalId?.toString(),
      assignmentId: timesheetWithDetails.assignmentId?.toString(),
      description: timesheetWithDetails.description || '',
      tasksCompleted: timesheetWithDetails.tasks || '',
      submittedAt: timesheetWithDetails.submittedAt?.toISOString() || '',
      approvedBy: timesheetWithDetails.user?.name || '',
      approvedAt: timesheetWithDetails.approvedAt?.toISOString() || '',
      createdAt: timesheetWithDetails.createdAt.toISOString(),
      updatedAt: timesheetWithDetails.updatedAt.toISOString(),
      employee: {
        id: timesheetWithDetails.employee.id.toString(),
        firstName: timesheetWithDetails.employee.firstName,
        lastName: timesheetWithDetails.employee.lastName,
        employeeId: timesheetWithDetails.employee.fileNumber,
        user: timesheetWithDetails.user ? {
          name: timesheetWithDetails.user.name,
          email: timesheetWithDetails.user.email,
        } : undefined,
      },
      project: timesheetWithDetails.project ? {
        id: timesheetWithDetails.project.id.toString(),
        name: timesheetWithDetails.project.name,
      } : undefined,
      rental: timesheetWithDetails.rental ? {
        id: timesheetWithDetails.rental.id.toString(),
        rentalNumber: timesheetWithDetails.rental.rentalNumber,
      } : undefined,
      assignment: timesheetWithDetails.assignment ? {
        id: timesheetWithDetails.assignment.id.toString(),
        name: timesheetWithDetails.assignment.assignmentType || '',
        type: timesheetWithDetails.assignment.assignmentType,
      } : undefined,
    };

    return NextResponse.json(transformedTimesheet);
  } catch (error) {
    console.error('Error updating timesheet:', error);
    return NextResponse.json(
      { error: 'Failed to update timesheet', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const timesheet = await prisma.timesheet.findUnique({
      where: { id: parseInt(id) },
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

    if (!timesheet) {
      return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 });
    }

    // Transform the response to match frontend interface
    const transformedTimesheet = {
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
    };

    return NextResponse.json(transformedTimesheet);
  } catch (error) {
    console.error('Error fetching timesheet:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timesheet', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if timesheet exists
    const existingTimesheet = await prisma.timesheet.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingTimesheet) {
      return NextResponse.json(
        { error: 'Timesheet not found' },
        { status: 404 }
      );
    }

    // Check user role from request headers or session
    const userRole = request.headers.get('x-user-role') || 'USER'; // Default to USER if not provided

    // Only admin can delete non-draft timesheets
    if (existingTimesheet.status !== 'draft' && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only draft timesheets can be deleted by non-admin users' },
        { status: 400 }
      );
    }

    // Delete the timesheet
    await prisma.timesheet.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json(
      { message: 'Timesheet deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting timesheet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
