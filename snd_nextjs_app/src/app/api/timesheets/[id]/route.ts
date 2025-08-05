import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Update the timesheet
    const updatedTimesheet = await prisma.timesheet.update({
      where: { id: parseInt(params.id) },
      data: {
        hours_worked: parseFloat(hoursWorked),
        overtime_hours: parseFloat(overtimeHours),
        ...(status && { status }),
        ...(description && { description }),
        ...(tasksCompleted && { tasks: tasksCompleted }),
      },
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

    // Transform the response to match frontend interface
    const transformedTimesheet = {
      id: updatedTimesheet.id.toString(),
      employeeId: updatedTimesheet.employee_id.toString(),
      date: updatedTimesheet.date.toISOString().split('T')[0],
      hoursWorked: updatedTimesheet.hours_worked,
      overtimeHours: updatedTimesheet.overtime_hours,
      startTime: updatedTimesheet.start_time?.toISOString() || '',
      endTime: updatedTimesheet.end_time?.toISOString() || '',
      status: updatedTimesheet.status,
      projectId: updatedTimesheet.project_id?.toString(),
      rentalId: updatedTimesheet.rental_id?.toString(),
      assignmentId: updatedTimesheet.assignment_id?.toString(),
      description: updatedTimesheet.description || '',
      tasksCompleted: updatedTimesheet.tasks || '',
      submittedAt: updatedTimesheet.submitted_at?.toISOString() || '',
      approvedBy: updatedTimesheet.approved_by_user?.name || '',
      approvedAt: updatedTimesheet.approved_at?.toISOString() || '',
      createdAt: updatedTimesheet.created_at.toISOString(),
      updatedAt: updatedTimesheet.updated_at.toISOString(),
      employee: {
        id: updatedTimesheet.employee.id.toString(),
        firstName: updatedTimesheet.employee.first_name,
        lastName: updatedTimesheet.employee.last_name,
        employeeId: updatedTimesheet.employee.employee_id,
        user: updatedTimesheet.employee.user ? {
          name: updatedTimesheet.employee.user.name,
          email: updatedTimesheet.employee.user.email,
        } : undefined,
      },
      project: updatedTimesheet.project_rel ? {
        id: updatedTimesheet.project_rel.id.toString(),
        name: updatedTimesheet.project_rel.name,
      } : undefined,
      rental: updatedTimesheet.rental ? {
        id: updatedTimesheet.rental.id.toString(),
        rentalNumber: updatedTimesheet.rental.rental_number,
      } : undefined,
      assignment: updatedTimesheet.assignment ? {
        id: updatedTimesheet.assignment.id.toString(),
        name: updatedTimesheet.assignment.name || '',
        type: updatedTimesheet.assignment.type,
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const timesheet = await prisma.timesheet.findUnique({
      where: { id: parseInt(params.id) },
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
