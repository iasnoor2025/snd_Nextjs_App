import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { employeeLeaves, employees } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

export const PUT = withPermission(PermissionConfigs.leave.reject)(async (request: NextRequest) => {
  try {
    // Extract id from URL params
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2]; // Get id from /api/leave-requests/[id]/reject
    
    if (!id) {
      return NextResponse.json({ error: 'Leave request ID is required' }, { status: 400 });
    }
    
    const session = await getServerSession(authConfig);
    const body = await request.json();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Find the leave request with employee details
    const leaveRequestData = await db
      .select({
        id: employeeLeaves.id,
        status: employeeLeaves.status,
        employee: {
          id: employees.id,
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
        rejectionReason: body.rejection_reason || 'Rejected by manager',
      })
      .where(eq(employeeLeaves.id, parseInt(id)));

    return NextResponse.json({
      success: true,
      message: 'Leave request rejected successfully',
    });
  } catch (error) {
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
