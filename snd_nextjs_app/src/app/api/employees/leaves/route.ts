import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withEmployeeOwnDataAccess } from '@/lib/rbac/api-middleware';

// GET /api/employees/leaves - Get leave requests for the current employee
const getLeavesHandler = async (request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } }) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('status') || '';
    const leaveType = searchParams.get('leaveType') || '';

    const skip = (page - 1) * limit;

    const where: any = {
      deleted_at: null,
    };

    // For employee users, only show their own leave requests
    if (request.employeeAccess?.ownEmployeeId) {
      where.employee_id = request.employeeAccess.ownEmployeeId;
    }

    if (status) {
      where.status = status;
    }

    if (leaveType) {
      where.leave_type = leaveType;
    }

    const [leaves, total] = await Promise.all([
      prisma.employeeLeave.findMany({
        where,
        take: limit,
        skip,
        orderBy: {
          created_at: 'desc',
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
      }),
      prisma.employeeLeave.count({ where }),
    ]);

    const formattedLeaves = leaves.map(leave => ({
      id: leave.id,
      leave_type: leave.leave_type,
      start_date: leave.start_date.toISOString().split('T')[0],
      end_date: leave.end_date.toISOString().split('T')[0],
      days: leave.days,
      status: leave.status,
      reason: leave.reason,
      employee: {
        id: leave.employee.id,
        name: `${leave.employee.first_name} ${leave.employee.last_name}`,
        employee_id: leave.employee.employee_id,
      },
      created_at: leave.created_at.toISOString(),
      updated_at: leave.updated_at.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      leaves: formattedLeaves,
      total,
      page,
      limit,
      message: 'Leave requests retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /api/employees/leaves:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch leave requests: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
};

// POST /api/employees/leaves - Create a new leave request
const createLeaveHandler = async (request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } }) => {
  try {
    const body = await request.json();

    // For employee users, ensure they can only create leave requests for themselves
    if (request.employeeAccess?.ownEmployeeId) {
      body.employee_id = request.employeeAccess.ownEmployeeId;
    }

    const leaveRequest = await prisma.employeeLeave.create({
      data: {
        employee_id: body.employee_id,
        leave_type: body.leave_type,
        start_date: new Date(body.start_date),
        end_date: new Date(body.end_date),
        days: body.days_requested,
        reason: body.reason,
        status: 'pending',
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
      leave: leaveRequest,
      message: 'Leave request created successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/employees/leaves:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create leave request: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
};

// Export the wrapped handlers
export const GET = withEmployeeOwnDataAccess(getLeavesHandler);
export const POST = withEmployeeOwnDataAccess(createLeaveHandler); 