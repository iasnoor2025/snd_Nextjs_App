import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/rbac/api-middleware';
import { authConfig } from '@/lib/auth-config';

// GET /api/employees/leaves - Get leave requests for the current employee
const getLeavesHandler = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('status') || '';
    const leaveType = searchParams.get('leaveType') || '';
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    const where: any = {};

    // Get session to check user role
    const session = await getServerSession(authConfig);
    const user = session?.user;
    
    // For employee users, only show their own leave requests
    if (user?.role === 'EMPLOYEE') {
      // Find employee record that matches user's national_id
      const ownEmployee = await prisma.employee.findFirst({
        where: { iqama_number: user.national_id },
        select: { id: true },
      });
      if (ownEmployee) {
        where.employee_id = ownEmployee.id;
      }
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (leaveType && leaveType !== 'all') {
      where.leave_type = leaveType;
    }

    // Add search functionality
    if (search) {
      where.OR = [
        {
          employee: {
            OR: [
              { first_name: { contains: search, mode: 'insensitive' } },
              { last_name: { contains: search, mode: 'insensitive' } },
              { employee_id: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
        { reason: { contains: search, mode: 'insensitive' } },
        { leave_type: { contains: search, mode: 'insensitive' } },
      ];
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
const createLeaveHandler = async (request: NextRequest) => {
  try {
    const body = await request.json();

    // Get session to check user role
    const session = await getServerSession(authConfig);
    const user = session?.user;
    
    // For employee users, ensure they can only create leave requests for themselves
    if (user?.role === 'EMPLOYEE') {
      // Find employee record that matches user's national_id
      const ownEmployee = await prisma.employee.findFirst({
        where: { iqama_number: user.national_id },
        select: { id: true },
      });
      if (ownEmployee) {
        body.employee_id = ownEmployee.id;
      }
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
export const GET = withAuth(getLeavesHandler);
export const POST = withAuth(createLeaveHandler); 