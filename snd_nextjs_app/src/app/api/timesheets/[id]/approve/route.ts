import { db } from '@/lib/db';
import { timesheets } from '@/lib/drizzle/schema';
import { withPermission } from '@/lib/rbac/api-middleware';
import { checkUserPermission } from '@/lib/rbac/permission-service';
import { eq } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// Multi-stage approval workflow stages
const APPROVAL_STAGES = ['foreman', 'incharge', 'checking', 'manager'] as const;
type ApprovalStage = (typeof APPROVAL_STAGES)[number];

// Helper function to get the next approval stage
function getNextApprovalStage(currentStatus: string): ApprovalStage | null {
  switch (currentStatus) {
    case 'draft':
      return 'foreman'; // Draft can be submitted for foreman approval
    case 'pending':
      return 'foreman'; // Pending is treated same as submitted
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
export const POST = async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;

    const timesheetId = parseInt(id);

    if (isNaN(timesheetId)) {
      console.error('[APPROVE] Invalid timesheet ID - NaN');
      return NextResponse.json({ error: 'Invalid timesheet ID' }, { status: 400 });
    }

    // Authentication check
    const session = await getServerSession();

    if (!session?.user?.id) {
      console.error('[APPROVE] No session or user ID');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get the timesheet

    const timesheet = await db
      .select()
      .from(timesheets)
      .where(eq(timesheets.id, timesheetId))
      .limit(1);

    if (timesheet.length === 0) {
      console.error('[APPROVE] Timesheet not found:', timesheetId);
      return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 });
    }

    const timesheetData = timesheet[0];
    if (!timesheetData) {
      console.error('[APPROVE] Timesheet data is null');
      return NextResponse.json({ error: 'Timesheet data not found' }, { status: 404 });
    }

    // Database-driven permission check
    const { checkUserPermission } = await import('@/lib/rbac/permission-service');
    const permissionResult = await checkUserPermission(userId, 'approve', 'Timesheet');

    if (!permissionResult.hasPermission) {
      console.error('[APPROVE] Permission denied:', permissionResult.reason);
      return NextResponse.json({
        error: permissionResult.reason || 'Insufficient permissions'
      }, { status: 403 });
    }

    // Automatically determine the next approval stage based on current status
    const nextStage = getNextApprovalStage(timesheetData.status);

    if (!nextStage) {
      console.error('[APPROVE] Cannot approve further. Current status:', timesheetData.status);
      return NextResponse.json(
        {
          error: `Timesheet cannot be approved further. Current status: ${timesheetData.status}`,
        },
        { status: 400 }
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
          approvedAt: new Date().toISOString().split('T')[0], // Convert to date format (YYYY-MM-DD)
          updatedAt: new Date().toISOString().split('T')[0], // Convert to date format (YYYY-MM-DD)
        })
        .where(eq(timesheets.id, timesheetId))
        .returning();

      const updatedTimesheetData = updatedTimesheet[0];
      if (!updatedTimesheetData) {
        console.error('[APPROVE] Failed to update timesheet - no data returned');
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
      console.error('[APPROVE] Error updating timesheet:', error);
      return NextResponse.json(
        {
          error: `Failed to approve timesheet to ${nextStage} stage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[APPROVE] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};
