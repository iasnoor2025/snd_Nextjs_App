
import { db } from '@/lib/drizzle';
import { employeeLeaves, employees } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

export const PUT = withPermission(PermissionConfigs.leave.approve)(async (request: NextRequest) => {
  try {
    // Extract id from URL params
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2]; // Get id from /api/leave-requests/[id]/approve
    
    if (!id) {
      return NextResponse.json({ error: 'Leave request ID is required' }, { status: 400 });
    }

    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Find the leave request with employee details
    const leaveRequestData = await db
      .select({
        id: employeeLeaves.id,
        status: employeeLeaves.status,
        startDate: employeeLeaves.startDate,
        endDate: employeeLeaves.endDate,
        employeeId: employeeLeaves.employeeId,
        employee: {
          id: employees.id,
          status: employees.status,
        },
      })
      .from(employeeLeaves)
      .leftJoin(employees, eq(employeeLeaves.employeeId, employees.id))
      .where(eq(employeeLeaves.id, parseInt(id)))
      .limit(1);

    const leaveRequest = leaveRequestData[0];
    if (!leaveRequest) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    // Only allow approval of pending requests
    if (leaveRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending leave requests can be approved' },
        { status: 400 }
      );
    }

    // Update the leave request status to approved
    await db
      .update(employeeLeaves)
      .set({
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: parseInt(session.user.id),
      })
      .where(eq(employeeLeaves.id, parseInt(id)));

    // Update employee status to 'on_leave' if the leave is currently active
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]!; // YYYY-MM-DD format - non-null assertion
    const isLeaveCurrentlyActive =
      leaveRequest.startDate &&
      leaveRequest.endDate &&
      leaveRequest.startDate <= todayStr &&
      leaveRequest.endDate >= todayStr;

    if (isLeaveCurrentlyActive) {
      await db
        .update(employees)
        .set({ status: 'on_leave' })
        .where(eq(employees.id, leaveRequest.employeeId));
    }

    return NextResponse.json({
      success: true,
      message: 'Leave request approved successfully',
    });
  } catch (error) {
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
