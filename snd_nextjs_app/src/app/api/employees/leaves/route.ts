import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { employeeLeaves, employees as employeesTable } from '@/lib/drizzle/schema';
import { withAuth } from '@/lib/rbac/api-middleware';
import { and, desc, eq, ilike, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

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

    const filters: any[] = [];

    // Get session to check user role
    const session = await getServerSession(authConfig);
    const user = session?.user;

    // For employee users, only show their own leave requests
    if (user?.role === 'EMPLOYEE' && user.national_id) {
      const ownRows = await db
        .select({ id: employeesTable.id })
        .from(employeesTable)
        .where(eq(employeesTable.iqamaNumber, String(user.national_id)))
        .limit(1);
      const ownId = ownRows[0]?.id;
      if (ownId) filters.push(eq(employeeLeaves.employeeId, ownId));
    }

    if (status && status !== 'all') {
      filters.push(eq(employeeLeaves.status, status));
    }

    if (leaveType && leaveType !== 'all') {
      filters.push(eq(employeeLeaves.leaveType, leaveType));
    }

    // Add search functionality
    if (search) {
      const s = `%${search}%`;
      filters.push(ilike(employeesTable.firstName, s) as any);
    }

    const whereExpr = filters.length ? and(...filters) : undefined;

    const totalRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(employeeLeaves)
      .leftJoin(employeesTable, eq(employeesTable.id, employeeLeaves.employeeId))
      .where(whereExpr as any);
    const total = Number((totalRow as any)[0]?.count ?? 0);

    const leaves = await db
      .select({
        id: employeeLeaves.id,
        leave_type: employeeLeaves.leaveType,
        start_date: employeeLeaves.startDate,
        end_date: employeeLeaves.endDate,
        days: employeeLeaves.days,
        status: employeeLeaves.status,
        reason: employeeLeaves.reason,
        created_at: employeeLeaves.createdAt,
        updated_at: employeeLeaves.updatedAt,
        emp_id: employeesTable.id,
        emp_first: employeesTable.firstName,
        emp_last: employeesTable.lastName,
        emp_employee_id: employeesTable.id,
      })
      .from(employeeLeaves)
      .leftJoin(employeesTable, eq(employeesTable.id, employeeLeaves.employeeId))
      .where(whereExpr as any)
      .orderBy(desc(employeeLeaves.createdAt))
      .offset(skip)
      .limit(limit);

    const formattedLeaves = leaves.map(leave => ({
      id: leave.id,
      leave_type: leave.leave_type,
      start_date: leave.start_date
        ? new Date(leave.start_date as unknown as string).toISOString().split('T')[0] || null
        : '',
      end_date: leave.end_date
        ? new Date(leave.end_date as unknown as string).toISOString().split('T')[0] || null
        : '',
      days: leave.days,
      status: leave.status,
      reason: leave.reason,
      employee: {
        id: leave.emp_id,
        name: `${leave.emp_first ?? ''} ${leave.emp_last ?? ''}`.trim(),
        employee_id: leave.emp_employee_id,
      },
      created_at: leave.created_at
        ? new Date(leave.created_at as unknown as string).toISOString()
        : '',
      updated_at: leave.updated_at
        ? new Date(leave.updated_at as unknown as string).toISOString()
        : '',
    }));

    return NextResponse.json({
      success: true,
      leaves: formattedLeaves,
      total,
      page,
      limit,
      message: 'Leave requests retrieved successfully',
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch leave requests: ' + (error as Error).message,
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
    if (user?.role === 'EMPLOYEE' && user.national_id) {
      const ownRows = await db
        .select({ id: employeesTable.id })
        .from(employeesTable)
        .where(eq(employeesTable.iqamaNumber, String(user.national_id)))
        .limit(1);
      if (ownRows[0]?.id) {
        body.employee_id = ownRows[0].id;
      }
    }

    const inserted = await db
      .insert(employeeLeaves)
      .values({
        employeeId: body.employee_id,
        leaveType: body.leave_type,
        startDate: new Date(body.start_date).toISOString(),
        endDate: new Date(body.end_date).toISOString(),
        days: body.days_requested,
        reason: body.reason,
        status: 'pending',
        updatedAt: new Date().toISOString(),
      })
      .returning();
    const leaveRequest = inserted[0];

    return NextResponse.json({
      success: true,
      leave: leaveRequest,
      message: 'Leave request created successfully',
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create leave request: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
};

// Export the wrapped handlers
export const GET = withAuth(getLeavesHandler);
export const POST = withAuth(createLeaveHandler);
