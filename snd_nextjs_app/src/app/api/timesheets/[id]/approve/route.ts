import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { timesheets } from '@/lib/drizzle/schema';
import { withPermission } from '@/lib/rbac/api-middleware';
import { checkUserPermission } from '@/lib/rbac/permission-service';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// Multi-stage approval workflow stages
const APPROVAL_STAGES = ['foreman', 'incharge', 'checking', 'manager'] as const;
type ApprovalStage = (typeof APPROVAL_STAGES)[number];

// Helper function to get the next approval stage
function getNextApprovalStage(currentStatus: string): ApprovalStage | null {
  switch (currentStatus) {
    case 'draft':
      return 'foreman'; // Draft can be submitted for foreman approval
    case 'submitted':
      return 'foreman';
    case 'foreman_approved':
      return 'incharge';
    case 'incharge_approved':
      return 'checking';
    case 'checking_approved':
      return 'manager';
    case 'manager_approved':
      return null; // Final stage reached
    default:
      return null;
  }
}

// Helper function to get the approval status for a stage
function getApprovalStatusForStage(stage: ApprovalStage): string {
  switch (stage) {
    case 'foreman':
      return 'foreman_approved';
    case 'incharge':
      return 'incharge_approved';
    case 'checking':
      return 'checking_approved';
    case 'manager':
      return 'manager_approved';
    default:
      return 'approved';
  }
}

// Helper function to check if user can approve at specific stage
async function checkStageApprovalPermission(userId: string, stage: ApprovalStage) {
  // Check if user has specific stage approval permission
  const stagePermission = `approve.Timesheet.${stage.charAt(0).toUpperCase() + stage.slice(1)}`;
  const stageResult = await checkUserPermission(userId, 'approve', `Timesheet.${stage.charAt(0).toUpperCase() + stage.slice(1)}`);
  
  if (stageResult.hasPermission) {
    return { allowed: true };
  }

  // Check if user has general timesheet approval permission
  const generalResult = await checkUserPermission(userId, 'approve', 'Timesheet');
  if (generalResult.hasPermission) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `You don't have permission to approve timesheets at ${stage} stage`,
  };
}

// POST /api/timesheets/[id]/approve - Approve a single timesheet
export const POST = withPermission(
  async (_request: NextRequest, { params }: { params: { id: string } }) => {
    try {

      const timesheetId = parseInt(await params.id);
      if (isNaN(timesheetId)) {
        return NextResponse.json({ error: 'Invalid timesheet ID' }, { status: 400 });
      }

      // Get the timesheet
      const timesheet = await db
        .select()
        .from(timesheets)
        .where(eq(timesheets.id, timesheetId))
        .limit(1);

      if (timesheet.length === 0) {
        return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 });
      }

      const timesheetData = timesheet[0];
      if (!timesheetData) {
        return NextResponse.json({ error: 'Timesheet data not found' }, { status: 404 });
      }

      // Get session to check user permissions
      const session = await getServerSession(authConfig);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const userId = session.user.id;

      // Automatically determine the next approval stage based on current status
      const nextStage = getNextApprovalStage(timesheetData.status);

      if (!nextStage) {
        
        return NextResponse.json(
          {
            error: `Timesheet cannot be approved further. Current status: ${timesheetData.status}`,
          },
          { status: 400 }
        );
      }

      // Check if user can approve at this stage
      const canApprove = await checkStageApprovalPermission(userId, nextStage);
      if (!canApprove.allowed) {
        
        return NextResponse.json(
          {
            error: canApprove.reason || 'Permission denied',
          },
          { status: 403 }
        );
      }

      // Approve the timesheet to the next stage
      try {
        const newStatus = getApprovalStatusForStage(nextStage);
        const updatedTimesheet = await db
          .update(timesheets)
          .set({
            status: newStatus,
            approvedBy: parseInt(userId),
            approvedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(timesheets.id, timesheetId))
          .returning();

        const updatedTimesheetData = updatedTimesheet[0];
        if (!updatedTimesheetData) {
          return NextResponse.json({ error: 'Failed to update timesheet' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: `Timesheet approved to ${nextStage} stage`,
          data: {
            id: updatedTimesheetData.id,
            status: updatedTimesheetData.status,
            approvedBy: updatedTimesheetData.approvedBy,
            approvedAt: updatedTimesheetData.approvedAt,
          },
        });
      } catch (error) {
        
        return NextResponse.json(
          {
            error: `Failed to approve timesheet to ${nextStage} stage: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
          { status: 500 }
        );
      }
    } catch (error) {
      
      return NextResponse.json(
        {
          error: 'Internal server error',
        },
        { status: 500 }
      );
    }
  },
  { action: 'approve', subject: 'Timesheet' }
);
