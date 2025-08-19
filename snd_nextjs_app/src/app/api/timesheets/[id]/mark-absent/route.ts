import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { timesheets } from '@/lib/drizzle/schema';
import { withPermission } from '@/lib/rbac/api-middleware';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/timesheets/[id]/mark-absent - Mark employee as absent
export const POST = withPermission(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {

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
      if (!timesheetData) {
        return NextResponse.json({ error: 'Timesheet data not found' }, { status: 404 });
      }

      // Get session to check user permissions
      const session = await getServerSession(authConfig);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // const userId = session.user.id;

      // Update the timesheet to mark as absent
      try {
        const updatedTimesheet = await db
          .update(timesheets)
          .set({
            status: 'absent',
            notes: reason || 'Marked absent by foreman/supervisor',
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
          message: 'Employee marked as absent successfully',
          data: {
            id: updatedTimesheetData.id,
            status: updatedTimesheetData.status,
            notes: updatedTimesheetData.notes,
          },
        });
      } catch (error) {
        
        return NextResponse.json(
          {
            error: `Failed to mark employee as absent: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
  { action: 'update', subject: 'Timesheet' }
);
