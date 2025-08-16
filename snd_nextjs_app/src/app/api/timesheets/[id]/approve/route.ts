import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { timesheets, employees, users } from '@/lib/drizzle/schema';
import { withPermission } from '@/lib/rbac/api-middleware';
import { checkUserPermission } from '@/lib/rbac/permission-service';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { eq, and } from 'drizzle-orm';

// Multi-stage approval workflow stages
const APPROVAL_STAGES = ['foreman', 'incharge', 'checking', 'manager'] as const;
type ApprovalStage = typeof APPROVAL_STAGES[number];

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
  console.log('🔍 SINGLE APPROVE - Checking permission for stage:', stage, 'user:', userId);
  
  // Check if user has specific stage approval permission
  const stageResult = await checkUserPermission(userId, 'approve', 'Timesheet');
  if (stageResult.hasPermission) {
    console.log('🔍 SINGLE APPROVE - Stage-specific permission granted for stage:', stage);
    return { allowed: true };
  }

  // Check if user has general timesheet approval permission
  const generalResult = await checkUserPermission(userId, 'approve', 'Timesheet');
  if (generalResult.hasPermission) {
    console.log('🔍 SINGLE APPROVE - General approval permission granted');
    return { allowed: true };
  }

  console.log('🔍 SINGLE APPROVE - No permission for stage:', stage);
  return {
    allowed: false,
    reason: `You don't have permission to approve timesheets at ${stage} stage`
  };
}

// POST /api/timesheets/[id]/approve - Approve a single timesheet
export const POST = withPermission(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      console.log('🔍 SINGLE APPROVE - Starting request for timesheet:', params.id);
      
      const timesheetId = parseInt(params.id);
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
      console.log('🔍 SINGLE APPROVE - Found timesheet:', {
        id: timesheetData.id,
        status: timesheetData.status,
        employeeId: timesheetData.employeeId
      });

      // Get session to check user permissions
      const session = await getServerSession(authConfig);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const userId = session.user.id;

      // Automatically determine the next approval stage based on current status
      const nextStage = getNextApprovalStage(timesheetData.status);
      
      if (!nextStage) {
        console.log(`🔍 SINGLE APPROVE - Timesheet ${timesheetData.id} cannot be approved further. Current status: ${timesheetData.status}`);
        return NextResponse.json({ 
          error: `Timesheet cannot be approved further. Current status: ${timesheetData.status}` 
        }, { status: 400 });
      }

      // Check if user can approve at this stage
      const canApprove = await checkStageApprovalPermission(userId, nextStage);
      if (!canApprove.allowed) {
        console.log(`🔍 SINGLE APPROVE - Stage approval permission denied: ${canApprove.reason}`);
        return NextResponse.json({ 
          error: canApprove.reason || 'Permission denied' 
        }, { status: 403 });
      }

      // Approve the timesheet to the next stage
      try {
        const newStatus = getApprovalStatusForStage(nextStage);
        const updatedTimesheet = await db
          .update(timesheets)
          .set({
            status: newStatus,
            approvedBy: userId,
            approvedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .where(eq(timesheets.id, timesheetId))
          .returning();

        console.log(`🔍 SINGLE APPROVE - Timesheet approved to ${nextStage} stage successfully: ${timesheetId} -> ${newStatus}`);
        
        return NextResponse.json({
          success: true,
          message: `Timesheet approved to ${nextStage} stage`,
          data: {
            id: updatedTimesheet[0].id,
            status: updatedTimesheet[0].status,
            approvedBy: updatedTimesheet[0].approvedBy,
            approvedAt: updatedTimesheet[0].approvedAt
          }
        });

      } catch (error) {
        console.error(`🔍 SINGLE APPROVE - Error approving timesheet ${timesheetId} to ${nextStage} stage:`, error);
        return NextResponse.json({ 
          error: `Failed to approve timesheet to ${nextStage} stage: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }, { status: 500 });
      }

    } catch (error) {
      console.error('🔍 SINGLE APPROVE - Unexpected error:', error);
      return NextResponse.json({ 
        error: 'Internal server error' 
      }, { status: 500 });
    }
  },
  { action: 'approve', subject: 'Timesheet' }
);
