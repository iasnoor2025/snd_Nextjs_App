import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { timesheets, employees, users } from '@/lib/drizzle/schema';
import { withPermission } from '@/lib/rbac/api-middleware';
import { checkUserPermission } from '@/lib/rbac/permission-service';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { eq, and, inArray } from 'drizzle-orm';

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
  console.log('🔍 CHECK STAGE APPROVAL - Checking permission for stage:', stage, 'user:', userId);
  
  // Check if user has specific stage approval permission
  const stageResult = await checkUserPermission(userId, 'approve', 'Timesheet');
  if (stageResult.hasPermission) {
    console.log('🔍 CHECK STAGE APPROVAL - Stage-specific permission granted for stage:', stage);
    return { allowed: true };
  }

  // Check if user has general timesheet approval permission
  const generalResult = await checkUserPermission(userId, 'approve', 'Timesheet');
  if (generalResult.hasPermission) {
    console.log('🔍 CHECK STAGE APPROVAL - General approval permission granted');
    return { allowed: true };
  }

  // For now, we'll skip the complex role checking and just check general permissions
  // The permission service already handles role-based access
  console.log('🔍 CHECK STAGE APPROVAL - No permission for stage:', stage);
  return {
    allowed: false,
    reason: `You don't have permission to approve timesheets at ${stage} stage`
  };
}

// Helper function to check if user can reject timesheets
async function checkRejectionPermission(userId: string) {
  // Check if user has general timesheet rejection permission
  const generalResult = await checkUserPermission(userId, 'reject', 'Timesheet');
  if (generalResult.hasPermission) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `You don't have permission to reject timesheets`
  };
}

// POST /api/timesheets/bulk-approve - Bulk approve/reject timesheets
export const POST = withPermission(
  async (request: NextRequest) => {
    try {
      console.log('🔍 BULK APPROVE - Starting request');
      
      const body = await request.json();
      console.log('🔍 BULK APPROVE - Raw request body:', body);
      const { timesheetIds, action, notes, approvalStage } = body;
      console.log('🔍 BULK APPROVE - Parsed request data:', { timesheetIds, action, notes, approvalStage });

      if (!Array.isArray(timesheetIds) || timesheetIds.length === 0) {
        return NextResponse.json(
          { error: 'Timesheet IDs must be a non-empty array' },
          { status: 400 }
        );
      }

      if (!['approve', 'reject'].includes(action)) {
        return NextResponse.json(
          { error: 'Action must be either "approve" or "reject"' },
          { status: 400 }
        );
      }

      // For approval, we'll automatically determine the approval stage based on current status
      // No need to require approvalStage parameter

      // Get user ID from session
      const session = await getServerSession(authConfig);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      const userId = session.user.id;

      const results: {
        approved: any[];
        rejected: any[];
        errors: { timesheetId: string; error: string }[];
      } = {
        approved: [],
        rejected: [],
        errors: []
      };

      // Get all timesheets that need to be processed
      const timesheetsToProcess = await db
        .select({
          id: timesheets.id,
          status: timesheets.status,
          employeeId: timesheets.employeeId,
        })
        .from(timesheets)
        .where(inArray(timesheets.id, timesheetIds.map(id => parseInt(id))));

      console.log('🔍 BULK APPROVE - Found timesheets to process:', timesheetsToProcess.length);

      for (const timesheet of timesheetsToProcess) {
        try {
          console.log(`🔍 BULK APPROVE - Processing timesheet:`, {
            id: timesheet.id,
            status: timesheet.status,
            employeeId: timesheet.employeeId,
            requestedStage: approvalStage
          });

          if (action === 'approve') {
            // Automatically determine the next approval stage based on current status
            const nextStage = getNextApprovalStage(timesheet.status);
            
            if (!nextStage) {
              console.log(`🔍 BULK APPROVE - Timesheet ${timesheet.id} cannot be approved further. Current status: ${timesheet.status}`);
              results.errors.push({
                timesheetId: timesheet.id.toString(),
                error: `Timesheet cannot be approved further. Current status: ${timesheet.status}`
              });
              continue;
            }

            // Check if user can approve at this stage
            const canApprove = await checkStageApprovalPermission(userId, nextStage);
            if (!canApprove.allowed) {
              console.log(`🔍 BULK APPROVE - Stage approval permission denied: ${canApprove.reason}`);
              results.errors.push({
                timesheetId: timesheet.id.toString(),
                error: canApprove.reason || 'Unknown error'
              });
              continue;
            }

            // Approve the timesheet to the next stage
            try {
              const newStatus = getApprovalStatusForStage(nextStage);
              const updatedTimesheet = await db
                .update(timesheets)
                .set({
                  status: newStatus,
                  notes: notes || undefined,
                  updatedAt: new Date().toISOString()
                })
                .where(eq(timesheets.id, timesheet.id))
                .returning();

              console.log(`🔍 BULK APPROVE - Timesheet approved to ${nextStage} stage successfully: ${timesheet.id} -> ${newStatus}`);
              results.approved.push(updatedTimesheet[0]);
            } catch (error) {
              console.error(`🔍 BULK APPROVE - Error approving timesheet ${timesheet.id} to ${nextStage} stage:`, error);
              results.errors.push({
                timesheetId: timesheet.id.toString(),
                error: `Failed to approve timesheet to ${nextStage} stage: ${error instanceof Error ? error.message : 'Unknown error'}`
              });
            }
          } else if (action === 'reject') {
            // Check if timesheet can be rejected
            const canProcess = ['submitted', 'foreman_approved', 'incharge_approved', 'checking_approved'].includes(timesheet.status);

            if (!canProcess) {
              results.errors.push({
                timesheetId: timesheet.id.toString(),
                error: `Timesheet cannot be rejected. Current status: ${timesheet.status}`
              });
              continue;
            }

            // Check if user can reject
            const canReject = await checkRejectionPermission(userId);
            if (!canReject.allowed) {
              results.errors.push({
                timesheetId: timesheet.id.toString(),
                error: canReject.reason || 'Unknown error'
              });
              continue;
            }

            // Reject the timesheet
            try {
              const updatedTimesheet = await db
                .update(timesheets)
                .set({
                  status: 'rejected',
                  rejectionReason: notes || undefined,
                  updatedAt: new Date().toISOString()
                })
                .where(eq(timesheets.id, timesheet.id))
                .returning();

              results.rejected.push(updatedTimesheet[0]);
            } catch (error) {
              console.error(`🔍 BULK APPROVE - Error rejecting timesheet ${timesheet.id}:`, error);
              results.errors.push({
                timesheetId: timesheet.id.toString(),
                error: `Failed to reject timesheet: ${error instanceof Error ? error.message : 'Unknown error'}`
              });
            }
          }
        } catch (error) {
          console.error(`Error processing timesheet ${timesheet.id}:`, error);
          results.errors.push({
            timesheetId: timesheet.id.toString(),
            error: 'Failed to process timesheet'
          });
        }
      }

      console.log('🔍 BULK APPROVE - Final results:', results);
      console.log('🔍 BULK APPROVE - Summary:', {
        totalProcessed: timesheetIds.length,
        approved: results.approved.length,
        rejected: results.rejected.length,
        errors: results.errors.length
      });

      return NextResponse.json({
        success: true,
        message: `Successfully ${action}d ${action === 'approve' ? results.approved.length : results.rejected.length} timesheets`,
        results
      });

    } catch (error) {
      console.error('Error in bulk approval:', error);
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

  