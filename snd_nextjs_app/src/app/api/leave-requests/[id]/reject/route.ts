import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/drizzle';
import { employeeLeaves, employees } from '@/lib/drizzle/schema';
import { authConfig } from '@/lib/auth-config';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authConfig);
    const body = await request.json();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user has permission to reject leave requests
    // Allow SUPER_ADMIN, ADMIN, MANAGER, SUPERVISOR, OPERATOR, EMPLOYEE roles
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'EMPLOYEE'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Access denied. Insufficient permissions to reject leave requests.' },
        { status: 403 }
      );
    }

    // Find the leave request with employee details
    const leaveRequestData = await db
      .select({
        id: employeeLeaves.id,
        status: employeeLeaves.status,
        employee: {
          id: employees.id
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

    // Only allow rejection of pending requests
    if (leaveRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending leave requests can be rejected' },
        { status: 400 }
      );
    }

    // Update the leave request status to rejected
    await db
      .update(employeeLeaves)
      .set({
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectedBy: parseInt(session.user.id),
        rejectionReason: body.rejection_reason || 'Rejected by manager'
      })
      .where(eq(employeeLeaves.id, parseInt(id)));

    return NextResponse.json({
      success: true,
      message: 'Leave request rejected successfully'
    });

  } catch (error) {
    console.error('Error rejecting leave request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
