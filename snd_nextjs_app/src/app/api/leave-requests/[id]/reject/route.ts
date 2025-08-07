import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authConfig } from '@/lib/auth-config';

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
    if (session.user.role !== 'ADMIN' && session.user.role !== 'HR') {
      return NextResponse.json(
        { error: 'Access denied. Admin or HR role required.' },
        { status: 403 }
      );
    }

    // Find the leave request
    const leaveRequest = await prisma.employeeLeave.findUnique({
      where: { id: parseInt(id) },
      include: { employee: true }
    });

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
    await prisma.employeeLeave.update({
      where: { id: parseInt(id) },
      data: {
        status: 'rejected',
        rejected_at: new Date(),
        rejected_by: parseInt(session.user.id),
        rejection_reason: body.rejection_reason || 'Rejected by manager'
      }
    });

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
