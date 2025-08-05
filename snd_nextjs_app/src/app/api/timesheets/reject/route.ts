import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/rbac/api-middleware';
import { checkUserPermission } from '@/lib/rbac/permission-service';

// Helper function to get the appropriate permission for rejection stage
function getRejectionPermission(rejectionStage: string): string {
  switch (rejectionStage) {
    case 'foreman':
      return 'reject.timesheet.foreman';
    case 'incharge':
      return 'reject.timesheet.incharge';
    case 'checking':
      return 'reject.timesheet.checking';
    case 'manager':
      return 'reject.timesheet.manager';
    default:
      return 'reject.timesheet';
  }
}

// POST /api/timesheets/reject - Reject timesheet at specific stage
export const POST = withPermission(
  async (request: NextRequest) => {
    try {
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

      // Update timesheet with rejection
      const updatedTimesheet = await prisma.timesheet.update({
        where: { id: timesheetId },
        data: {
          status: 'rejected',
          rejection_reason: rejectionReason,
        },
        include: {
          employee: {
            include: {
              user: true
            }
          }
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
  },
  {
    action: 'reject',
    subject: 'Timesheet'
  }
);
