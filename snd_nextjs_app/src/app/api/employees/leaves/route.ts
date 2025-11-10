
import { db } from '@/lib/db';
import { employeeLeaves, employees as employeesTable } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { and, desc, eq, ilike, sql, gte, lte } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';
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
    const session = await getServerSession();
    const user = session?.user;

    // For employee users, only show their own leave requests
    // Use role-based access control instead of national_id
    if (user?.role === 'EMPLOYEE') {
      try {
        const [ownEmployee] = await db
          .select({ id: employeesTable.id })
          .from(employeesTable)
          .where(eq(employeesTable.userId, parseInt(user.id)))
          .limit(1);
        if (ownEmployee) {
          filters.push(eq(employeeLeaves.employeeId, ownEmployee.id));
        }
      } catch (error) {
        console.error('Error finding employee for user:', error);
        // If we can't find the employee, don't show any leaves
        filters.push(eq(employeeLeaves.employeeId, -1)); // This will ensure no results
      }
    }
    // For ADMIN, MANAGER, SUPERVISOR, SUPER_ADMIN roles, show all leaves (no restriction)

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
    const session = await getServerSession();
    const user = session?.user;

    // For employee users, ensure they can only create leave requests for themselves
    // Use role-based access control instead of national_id
    if (user?.role === 'EMPLOYEE') {
      try {
        const [ownEmployee] = await db
          .select({ id: employeesTable.id })
          .from(employeesTable)
          .where(eq(employeesTable.userId, parseInt(user.id)))
          .limit(1);
        if (ownEmployee) {
          body.employee_id = ownEmployee.id;
        }
      } catch (error) {
        console.error('Error finding employee for user:', error);
        return NextResponse.json(
          { error: 'Access denied. Employee not found.' },
          { status: 403 }
        );
      }
    }
    // For ADMIN, MANAGER, SUPERVISOR, SUPER_ADMIN roles, they can create leave requests for any employee

    // Validate leave balance
    const daysRequested = parseInt(body.days_requested) || 0;
    if (daysRequested < 1) {
      return NextResponse.json(
        { error: 'Invalid days requested. Must be at least 1 day.' },
        { status: 400 }
      );
    }

    // Default annual leave balance is 21 days (Saudi labor law standard)
    const DEFAULT_ANNUAL_LEAVE_BALANCE = 21;

    // Get current year boundaries
    const currentYear = new Date().getFullYear();
    const yearStart = `${currentYear}-01-01`;
    const yearEnd = `${currentYear}-12-31`;

    // Calculate total approved leave days taken this year
    const approvedLeavesThisYear = await db
      .select({
        days: employeeLeaves.days,
      })
      .from(employeeLeaves)
      .where(
        and(
          eq(employeeLeaves.employeeId, body.employee_id),
          eq(employeeLeaves.status, 'approved'),
          gte(employeeLeaves.startDate, yearStart),
          lte(employeeLeaves.startDate, yearEnd)
        )
      );

    // Calculate total approved days
    const totalApprovedDays = approvedLeavesThisYear
      .map(l => parseInt(String(l.days)) || 0)
      .reduce((sum, days) => sum + days, 0);

    const availableBalance = DEFAULT_ANNUAL_LEAVE_BALANCE - totalApprovedDays;

    // Check if requested days exceed available balance
    if (daysRequested > availableBalance) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient leave balance. Available: ${availableBalance} days, Requested: ${daysRequested} days`,
          availableBalance,
          requestedDays: daysRequested,
        },
        { status: 400 }
      );
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
export const GET = withPermission(PermissionConfigs.leave.read)(getLeavesHandler);
export const POST = withPermission(PermissionConfigs.leave.create)(createLeaveHandler);
