import { db } from '@/lib/db';
import { timesheets } from '@/lib/drizzle/schema';
import { withPermission } from '@/lib/rbac/api-middleware';
import { eq } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/timesheets/[id]/reject - Reject a timesheet
export const POST = withPermission({ action: 'reject', subject: 'Timesheet' })(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const timesheetId = parseInt(id);
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
      if (!timesheetData) {
        return NextResponse.json({ error: 'Timesheet data not found' }, { status: 404 });
      }

      // Get session to check user permissions
      const session = await getServerSession();
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // const userId = session.user.id;

      // Check if timesheet can be rejected
      const canReject = [
        'submitted',
        'pending',
        'foreman_approved',
        'incharge_approved',
        'checking_approved',
      ].includes(timesheetData.status);

      if (!canReject) {

        return NextResponse.json(
          {
            error: `Timesheet cannot be rejected. Current status: ${timesheetData.status}`,
          },
          { status: 400 }
        );
      }

      // Reject the timesheet
      try {
        const updatedTimesheet = await db
          .update(timesheets)
          .set({
            status: 'rejected',
            rejectionReason: reason || 'Rejected by foreman/supervisor',
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
          message: 'Timesheet rejected successfully',
          data: {
            id: updatedTimesheetData.id,
            status: updatedTimesheetData.status,
            rejectionReason: updatedTimesheetData.rejectionReason,
          },
        });
      } catch (error) {

        return NextResponse.json(
          {
            error: `Failed to reject timesheet: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
  }
);
