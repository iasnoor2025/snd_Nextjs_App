import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { timesheetId, rejectionReason, rejectionStage } = await request.json();

    // Get the timesheet
    const timesheet = await prisma.timesheet.findUnique({
      where: { id: timesheetId },
      include: {
        employee: {
          include: {
            user: true
          }
        }
      }
    });

    if (!timesheet) {
      return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 });
    }

    // Check if timesheet can be rejected
    if (timesheet.status === 'rejected' || timesheet.status === 'manager_approved') {
      return NextResponse.json({
        error: 'Timesheet cannot be rejected in its current status'
      }, { status: 400 });
    }

    // Validate rejection stage
    const validStages = ['foreman', 'incharge', 'checking', 'manager'];
    if (!validStages.includes(rejectionStage)) {
      return NextResponse.json({ error: 'Invalid rejection stage' }, { status: 400 });
    }

    // Check if rejection reason is provided
    if (!rejectionReason || rejectionReason.trim() === '') {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    // Check if user has permission to reject at this stage
    const userRole = session.user.role;
    let hasPermission = false;

    switch (rejectionStage) {
      case 'foreman':
        hasPermission = userRole === 'FOREMAN' || userRole === 'ADMIN';
        break;
      case 'incharge':
        hasPermission = userRole === 'TIMESHEET_INCHARGE' || userRole === 'ADMIN';
        break;
      case 'checking':
        hasPermission = userRole === 'TIMESHEET_CHECKER' || userRole === 'ADMIN';
        break;
      case 'manager':
        hasPermission = userRole === 'MANAGER' || userRole === 'ADMIN';
        break;
    }

    if (!hasPermission) {
      return NextResponse.json({
        error: `You don't have permission to reject at ${rejectionStage} stage`
      }, { status: 403 });
    }

    // Update timesheet with rejection
    const updatedTimesheet = await prisma.timesheet.update({
      where: { id: timesheetId },
      data: {
        status: 'rejected',
        rejectedBy: session.user.id,
        rejectedAt: new Date(),
        rejectionReason: rejectionReason,
        rejectionStage: rejectionStage
      },
      include: {
        employee: {
          include: {
            user: true
          }
        },
        rejector: true
      }
    });

    return NextResponse.json({
      message: `Timesheet rejected at ${rejectionStage} stage`,
      timesheet: updatedTimesheet
    });

  } catch (error) {
    console.error('Error rejecting timesheet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
