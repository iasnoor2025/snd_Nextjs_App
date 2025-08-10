import { NextRequest, NextResponse } from 'next/server';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { db } from '@/lib/drizzle';
import { employeeLeaves, employees } from '@/lib/drizzle/schema';
import { eq, desc } from 'drizzle-orm';

export const GET = withPermission(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
  try {
    const { id } = await params;

    // Fetch real leave data from the database using Drizzle
    const leaves = await db
      .select({
        id: employeeLeaves.id,
        leave_type: employeeLeaves.leaveType,
        start_date: employeeLeaves.startDate,
        end_date: employeeLeaves.endDate,
        days: employeeLeaves.days,
        reason: employeeLeaves.reason,
        status: employeeLeaves.status,
        approved_by: employeeLeaves.approvedBy,
        approved_at: employeeLeaves.approvedAt,
        rejected_by: employeeLeaves.rejectedBy,
        rejected_at: employeeLeaves.rejectedAt,
        rejection_reason: employeeLeaves.rejectionReason,
        created_at: employeeLeaves.createdAt,
        updated_at: employeeLeaves.updatedAt,
        employee: {
          first_name: employees.firstName,
          last_name: employees.lastName,
          employee_id: employees.employeeId
        }
      })
      .from(employeeLeaves)
      .leftJoin(employees, eq(employees.id, employeeLeaves.employeeId))
      .where(eq(employeeLeaves.employeeId, parseInt(id)))
      .orderBy(desc(employeeLeaves.createdAt));

    // Transform the data to match the expected format
    const transformedLeaves = leaves.map(leave => ({
      id: leave.id,
      leave_type: leave.leave_type,
      start_date: leave.start_date.toISOString().split('T')[0],
      end_date: leave.end_date.toISOString().split('T')[0],
      days: leave.days,
      reason: leave.reason || '',
      status: leave.status,
      approved_by: leave.approved_by,
      approved_at: leave.approved_at ? leave.approved_at.toISOString() : null,
      rejected_by: leave.rejected_by,
      rejected_at: leave.rejected_at ? leave.rejected_at.toISOString() : null,
      rejection_reason: leave.rejection_reason,
      created_at: leave.created_at.toISOString(),
      updated_at: leave.updated_at.toISOString(),
      employee: leave.employee
    }));

    return NextResponse.json({
      success: true,
      data: transformedLeaves,
      message: 'Leave requests retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /api/employees/[id]/leaves:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch leave requests: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
  },
  PermissionConfigs.leave.read
);

export const POST = withPermission(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
  try {
    const { id } = await params;
    const body = await request.json();

    // Create new leave request in the database using Drizzle
    const [newLeave] = await db
      .insert(employeeLeaves)
      .values({
        employeeId: parseInt(id),
        leaveType: body.leave_type,
        startDate: new Date(body.start_date),
        endDate: new Date(body.end_date),
        days: body.days || 0,
        reason: body.reason || '',
        status: body.status || 'pending'
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Leave request created successfully',
      data: newLeave
    });
  } catch (error) {
    console.error('Error in POST /api/employees/[id]/leaves:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create leave request: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
  },
  PermissionConfigs.leave.create
);
