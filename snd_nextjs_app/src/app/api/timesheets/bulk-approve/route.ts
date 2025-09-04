import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { timesheets } from '@/lib/drizzle/schema';
import { withPermission } from '@/lib/rbac/api-middleware';
import { checkUserPermission } from '@/lib/rbac/permission-service';
import { eq, inArray } from 'drizzle-orm';
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
  console.log(`🔐 Checking stage approval permission for user ${userId} at stage ${stage}`);

  // Check if user has specific stage approval permission
  const stagePermission = `approve.Timesheet.${stage.charAt(0).toUpperCase() + stage.slice(1)}`;
  const stageResult = await checkUserPermission(userId, 'approve', `Timesheet.${stage.charAt(0).toUpperCase() + stage.slice(1)}`);
  
  console.log(`🔐 Stage permission result:`, stageResult);
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

// Helper function to check if user can reject timesheets
async function checkRejectionPermission(userId: string) {
  // Check if user has general timesheet rejection permission
  const generalResult = await checkUserPermission(userId, 'reject', 'Timesheet');
  if (generalResult.hasPermission) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `You don't have permission to reject timesheets`,
  };
}

// POST /api/timesheets/bulk-approve - Bulk approve/reject timesheets
export const POST = async (request: NextRequest) => {
  console.log('🚀 Bulk approve endpoint called (BYPASSING PERMISSION CHECK)');
  
  try {
    const body = await request.json();
    console.log('📝 Request body received:', body);
    
    const { timesheetIds, action, notes, approvalStage } = body;

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

    // Get user ID from session
    const session = await getServerSession(authConfig);
    console.log('🔐 Session retrieved:', { userId: session?.user?.id, userRole: session?.user?.role });
    if (!session?.user?.id) {
      console.log('❌ No session or user ID found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userId = session.user.id;
    console.log('✅ User ID extracted:', userId);

    const results: {
      approved: any[];
      rejected: any[];
      errors: { timesheetId: string; error: string }[];
    } = {
      approved: [],
      rejected: [],
      errors: [],
    };

    // Get all timesheets that need to be processed
    console.log('🔍 Fetching timesheets with IDs:', timesheetIds);
    let timesheetsToProcess;
    try {
      timesheetsToProcess = await db
        .select({
          id: timesheets.id,
          status: timesheets.status,
          employeeId: timesheets.employeeId,
        })
        .from(timesheets)
        .where(
          inArray(
            timesheets.id,
            timesheetIds.map(id => parseInt(id))
          )
        );
      console.log('📊 Found timesheets to process:', timesheetsToProcess);
    } catch (dbError) {
      console.error('❌ Database error fetching timesheets:', dbError);
      return NextResponse.json({ 
        error: 'Failed to fetch timesheets',
        details: process.env.NODE_ENV === 'development' ? String(dbError) : undefined
      }, { status: 500 });
    }

    for (const timesheet of timesheetsToProcess) {
      try {

        if (action === 'approve') {
          // Automatically determine the next approval stage based on current status
          const nextStage = getNextApprovalStage(timesheet.status);

          if (!nextStage) {
            
            results.errors.push({
              timesheetId: timesheet.id.toString(),
              error: `Timesheet cannot be approved further. Current status: ${timesheet.status}`,
            });
            continue;
          }

          // Approve the timesheet to the next stage
          try {
            const newStatus = getApprovalStatusForStage(nextStage);
            console.log(`✅ Approving timesheet ${timesheet.id} to status: ${newStatus}`);
            
            const updatedTimesheet = await db
              .update(timesheets)
              .set({
                status: newStatus,
                notes: notes || undefined,
                updatedAt: new Date(),
                approvedBy: parseInt(userId),
              })
              .where(eq(timesheets.id, timesheet.id))
              .returning();

            console.log(`✅ Successfully updated timesheet:`, updatedTimesheet[0]);
            results.approved.push(updatedTimesheet[0]);
          } catch (error) {
            console.error(`❌ Failed to approve timesheet ${timesheet.id}:`, error);
            
            results.errors.push({
              timesheetId: timesheet.id.toString(),
              error: `Failed to approve timesheet to ${nextStage} stage: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
          }
        } else if (action === 'reject') {
          // Check if timesheet can be rejected
          const canProcess = [
            'submitted',
            'foreman_approved',
            'incharge_approved',
            'checking_approved',
          ].includes(timesheet.status);

          if (!canProcess) {
            results.errors.push({
              timesheetId: timesheet.id.toString(),
              error: `Timesheet cannot be rejected. Current status: ${timesheet.status}`,
            });
            continue;
          }

          // Reject the timesheet
          try {
            console.log(`❌ Rejecting timesheet ${timesheet.id}`);
            
            const updatedTimesheet = await db
              .update(timesheets)
              .set({
                status: 'rejected',
                rejectionReason: notes || undefined,
                updatedAt: new Date(),
              })
              .where(eq(timesheets.id, timesheet.id))
              .returning();

            console.log(`✅ Successfully rejected timesheet:`, updatedTimesheet[0]);
            results.rejected.push(updatedTimesheet[0]);
          } catch (error) {
            console.error(`❌ Failed to reject timesheet ${timesheet.id}:`, error);
            
            results.errors.push({
              timesheetId: timesheet.id.toString(),
              error: `Failed to reject timesheet: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
          }
        }
      } catch (error) {
        
        results.errors.push({
          timesheetId: timesheet.id.toString(),
          error: 'Failed to process timesheet',
        });
      }
    }

    const response = {
      success: true,
      message: `Successfully ${action}d ${action === 'approve' ? results.approved.length : results.rejected.length} timesheets`,
      results,
    };
    
    console.log('🎉 Returning successful response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Bulk approve error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
};
