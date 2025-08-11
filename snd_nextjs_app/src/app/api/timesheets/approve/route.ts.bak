import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { checkUserPermission } from '@/lib/rbac/permission-service';

// Helper function to get the appropriate permission for approval stage
function getApprovalPermission(approvalStage: string): string {
  switch (approvalStage) {
    case 'foreman':
      return 'approve.timesheet.foreman';
    case 'incharge':
      return 'approve.timesheet.incharge';
    case 'checking':
      return 'approve.timesheet.checking';
    case 'manager':
      return 'approve.timesheet.manager';
    default:
      return 'approve.timesheet';
  }
}

// POST /api/timesheets/approve - Approve timesheet at specific stage
export const POST = withPermission(
  async (request: NextRequest) => {
    try {
      const { timesheetId, approvalStage, notes } = await request.json();

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

      // Validate approval stage
      const validStages = ['foreman', 'incharge', 'checking', 'manager'];
      if (!validStages.includes(approvalStage)) {
        return NextResponse.json({ error: 'Invalid approval stage' }, { status: 400 });
      }

      // Check if timesheet can be approved at this stage
      let canApprove = false;
      let newStatus = '';

      switch (approvalStage) {
        case 'foreman':
          canApprove = timesheet.status === 'submitted';
          newStatus = 'foreman_approved';
          break;
        case 'incharge':
          canApprove = timesheet.status === 'foreman_approved';
          newStatus = 'incharge_approved';
          break;
        case 'checking':
          canApprove = timesheet.status === 'incharge_approved';
          newStatus = 'checking_approved';
          break;
        case 'manager':
          canApprove = timesheet.status === 'checking_approved';
          newStatus = 'manager_approved';
          break;
      }

      if (!canApprove) {
        return NextResponse.json({
          error: `Timesheet cannot be approved at ${approvalStage} stage. Current status: ${timesheet.status}`
        }, { status: 400 });
      }

      // Update timesheet with approval
      const updateData: any = {
        status: newStatus
      };

      switch (approvalStage) {
        case 'foreman':
          updateData.foremanApprovalBy = parseInt(request.headers.get('user-id') || '0');
          updateData.foremanApprovalAt = new Date();
          updateData.foremanApprovalNotes = notes;
          break;
        case 'incharge':
          updateData.timesheetInchargeApprovalBy = parseInt(request.headers.get('user-id') || '0');
          updateData.timesheetInchargeApprovalAt = new Date();
          updateData.timesheetInchargeApprovalNotes = notes;
          break;
        case 'checking':
          updateData.timesheetCheckingApprovalBy = parseInt(request.headers.get('user-id') || '0');
          updateData.timesheetCheckingApprovalAt = new Date();
          updateData.timesheetCheckingApprovalNotes = notes;
          break;
        case 'manager':
          updateData.managerApprovalBy = parseInt(request.headers.get('user-id') || '0');
          updateData.managerApprovalAt = new Date();
          updateData.managerApprovalNotes = notes;
          break;
      }

      const updatedTimesheet = await prisma.timesheet.update({
        where: { id: timesheetId },
        data: updateData,
        include: {
          employee: {
            include: {
              user: true
            }
          },
          approved_by_user: true
        }
      });

      return NextResponse.json({
        message: `Timesheet approved at ${approvalStage} stage`,
        timesheet: updatedTimesheet
      });

    } catch (error) {
      console.error('Error approving timesheet:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  },
  {
    action: 'approve',
    subject: 'Timesheet'
  }
);
