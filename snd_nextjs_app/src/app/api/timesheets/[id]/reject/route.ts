import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { timesheets } from '@/lib/drizzle/schema';
import { withPermission } from '@/lib/rbac/api-middleware';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { eq } from 'drizzle-orm';

// POST /api/timesheets/[id]/reject - Reject a timesheet
export const POST = withPermission(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      console.log('🔍 REJECT TIMESHEET - Starting request for timesheet:', params.id);
      
      const timesheetId = parseInt(params.id);
      if (isNaN(timesheetId)) {
        return NextResponse.json({ error: 'Invalid timesheet ID' }, { status: 400 });
      }

      const body = await request.json();
      const { reason } = body;

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
      console.log('🔍 REJECT TIMESHEET - Found timesheet:', {
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

      // Check if timesheet can be rejected
      const canReject = ['submitted', 'foreman_approved', 'incharge_approved', 'checking_approved'].includes(timesheetData.status);

      if (!canReject) {
        console.log(`🔍 REJECT TIMESHEET - Timesheet ${timesheetData.id} cannot be rejected. Current status: ${timesheetData.status}`);
        return NextResponse.json({ 
          error: `Timesheet cannot be rejected. Current status: ${timesheetData.status}` 
        }, { status: 400 });
      }

      // Reject the timesheet
      try {
        const updatedTimesheet = await db
          .update(timesheets)
          .set({
            status: 'rejected',
            rejectionReason: reason || 'Rejected by foreman/supervisor',
            updatedAt: new Date().toISOString()
          })
          .where(eq(timesheets.id, timesheetId))
          .returning();

        console.log(`🔍 REJECT TIMESHEET - Timesheet rejected successfully: ${timesheetId}`);
        
        return NextResponse.json({
          success: true,
          message: 'Timesheet rejected successfully',
          data: {
            id: updatedTimesheet[0].id,
            status: updatedTimesheet[0].status,
            rejectionReason: updatedTimesheet[0].rejectionReason
          }
        });

      } catch (error) {
        console.error(`🔍 REJECT TIMESHEET - Error rejecting timesheet ${timesheetId}:`, error);
        return NextResponse.json({ 
          error: `Failed to reject timesheet: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }, { status: 500 });
      }

    } catch (error) {
      console.error('🔍 REJECT TIMESHEET - Unexpected error:', error);
      return NextResponse.json({ 
        error: 'Internal server error' 
      }, { status: 500 });
    }
  },
  { action: 'reject', subject: 'Timesheet' }
);
