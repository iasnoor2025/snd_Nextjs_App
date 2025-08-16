import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/drizzle';
import { employeeLeaves, employees } from '@/lib/drizzle/schema';
import { authConfig } from '@/lib/auth-config';
import { eq } from 'drizzle-orm';

export async function PUT(
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user has permission to approve leave requests
    // Allow SUPER_ADMIN, ADMIN, MANAGER, SUPERVISOR, OPERATOR, EMPLOYEE roles
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'EMPLOYEE'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Access denied. Insufficient permissions to approve leave requests.' },
        { status: 403 }
      );
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
          status: employees.status
        }
      })
      .from(employeeLeaves)
      .leftJoin(employees, eq(employeeLeaves.employeeId, employees.id))
      .where(eq(employeeLeaves.id, parseInt(id)))
      .limit(1);

    const leaveRequest = leaveRequestData[0];
    if (!leaveRequest) {
      return NextResponse.json(
        { error: 'Leave request not found' },
        { status: 404 }
      );
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
        approvedBy: parseInt(session.user.id)
      })
      .where(eq(employeeLeaves.id, parseInt(id)));

    // Update employee status to 'on_leave' if the leave is currently active
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    const isLeaveCurrentlyActive = leaveRequest.startDate <= todayStr && leaveRequest.endDate >= todayStr;
    
    if (isLeaveCurrentlyActive) {
      await db
        .update(employees)
        .set({ status: 'on_leave' })
        .where(eq(employees.id, leaveRequest.employeeId));
    }

    return NextResponse.json({
      success: true,
      message: 'Leave request approved successfully'
    });

  } catch (error) {
    console.error('Error approving leave request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
