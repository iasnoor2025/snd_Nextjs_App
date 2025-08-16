import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { timesheets } from '@/lib/drizzle/schema';
import { withPermission } from '@/lib/rbac/api-middleware';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { eq } from 'drizzle-orm';

// PUT /api/timesheets/[id]/update-hours - Update hours and overtime
export const PUT = withPermission(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      console.log('🔍 UPDATE HOURS - Starting request for timesheet:', params.id);
      
      const timesheetId = parseInt(params.id);
      if (isNaN(timesheetId)) {
        return NextResponse.json({ error: 'Invalid timesheet ID' }, { status: 400 });
      }

      const body = await _request.json();
      const { hoursWorked, overtimeHours } = body;

      // Validate input
      if (typeof hoursWorked !== 'number' || hoursWorked < 0 || hoursWorked > 24) {
        return NextResponse.json({ error: 'Invalid hours worked. Must be between 0 and 24.' }, { status: 400 });
      }

      if (typeof overtimeHours !== 'number' || overtimeHours < 0 || overtimeHours > 12) {
        return NextResponse.json({ error: 'Invalid overtime hours. Must be between 0 and 12.' }, { status: 400 });
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
      console.log('🔍 UPDATE HOURS - Found timesheet:', {
        id: timesheetData.id,
        status: timesheetData.status,
        employeeId: timesheetData.employeeId,
        currentHours: timesheetData.hoursWorked,
        currentOvertime: timesheetData.overtimeHours
      });

      // Get session to check user permissions
      const session = await getServerSession(authConfig);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const userId = session.user.id;

      // Update the timesheet hours
      try {
        const updatedTimesheet = await db
          .update(timesheets)
          .set({
            hoursWorked: hoursWorked,
            overtimeHours: overtimeHours,
            notes: `Hours updated by foreman/supervisor. Previous: ${timesheetData.hoursWorked}h + ${timesheetData.overtimeHours}h OT. New: ${hoursWorked}h + ${overtimeHours}h OT.`,
            updatedAt: new Date().toISOString()
          })
          .where(eq(timesheets.id, timesheetId))
          .returning();

        console.log(`🔍 UPDATE HOURS - Hours updated successfully: ${timesheetId} - ${hoursWorked}h + ${overtimeHours}h OT`);
        
        return NextResponse.json({
          success: true,
          message: 'Hours updated successfully',
          data: {
            id: updatedTimesheet[0].id,
            hoursWorked: updatedTimesheet[0].hoursWorked,
            overtimeHours: updatedTimesheet[0].overtimeHours,
            notes: updatedTimesheet[0].notes
          }
        });

      } catch (error) {
        console.error(`🔍 UPDATE HOURS - Error updating hours for timesheet ${timesheetId}:`, error);
        return NextResponse.json({ 
          error: `Failed to update hours: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }, { status: 500 });
      }

    } catch (error) {
      console.error('🔍 UPDATE HOURS - Unexpected error:', error);
      return NextResponse.json({ 
        error: 'Internal server error' 
      }, { status: 500 });
    }
  },
  { action: 'update', subject: 'Timesheet' }
);
