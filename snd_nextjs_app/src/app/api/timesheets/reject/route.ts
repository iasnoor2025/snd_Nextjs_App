import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { timesheets, employees, users } from '@/lib/drizzle/schema';
import { withPermission } from '@/lib/rbac/api-middleware';
import { checkUserPermission } from '@/lib/rbac/permission-service';
import { eq } from 'drizzle-orm';

// Helper function to get the appropriate permission for rejection stage
function getRejectionPermission(rejectionStage: string): string {
  switch (rejectionStage) {
    case 'foreman':
      return 'reject.timesheet.foreman';
    case 'incharge':
      return 'reject.timesheet.incharge';
    case 'checking':
      return 'reject.timesheet.checking';
    case 'manager':
      return 'reject.timesheet.manager';
    default:
      return 'reject.timesheet';
  }
}

// POST /api/timesheets/reject - Reject timesheet at specific stage
export const POST = withPermission(
  async (request: NextRequest) => {
    try {
      const { timesheetId, rejectionReason, rejectionStage } = await _request.json();

      // Get the timesheet with employee and user details
      const timesheetData = await db
        .select({
          id: timesheets.id,
          status: timesheets.status,
          employeeId: employees.id,
          employeeFirstName: employees.firstName,
          employeeLastName: employees.lastName,
          employeeFileNumber: employees.fileNumber,
          userId: users.id,
          userName: users.name,
          userEmail: users.email
        })
        .from(timesheets)
        .leftJoin(employees, eq(timesheets.employeeId, employees.id))
        .leftJoin(users, eq(employees.userId, users.id))
        .where(eq(timesheets.id, parseInt(timesheetId)))
        .limit(1);

      const timesheet = timesheetData[0];
      if (!timesheet) {
        return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 });
      }

      // Check if timesheet can be rejected
      if (timesheet.status === 'rejected' || timesheet.status === 'manager_approved') {
        return NextResponse.json({
          error: 'Timesheet cannot be rejected in its current status'
        }, { status: 400 });
      }

      // Validate rejection stage
      const validStages = ['foreman', 'incharge', 'checking', 'manager'];
      if (!validStages.includes(rejectionStage)) {
        return NextResponse.json({ error: 'Invalid rejection stage' }, { status: 400 });
      }

      // Check if rejection reason is provided
      if (!rejectionReason || rejectionReason.trim() === '') {
        return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
      }

      // Update timesheet with rejection
      await db
        .update(timesheets)
        .set({
          status: 'rejected',
          rejectionReason: rejectionReason,
        })
        .where(eq(timesheets.id, parseInt(timesheetId)));

      // Fetch the updated timesheet with details
      const updatedTimesheetData = await db
        .select({
          id: timesheets.id,
          status: timesheets.status,
          rejectionReason: timesheets.rejectionReason,
          employeeId: employees.id,
          employeeFirstName: employees.firstName,
          employeeLastName: employees.lastName,
          employeeFileNumber: employees.fileNumber,
          userId: users.id,
          userName: users.name,
          userEmail: users.email
        })
        .from(timesheets)
        .leftJoin(employees, eq(timesheets.employeeId, employees.id))
        .leftJoin(users, eq(employees.userId, users.id))
        .where(eq(timesheets.id, parseInt(timesheetId)))
        .limit(1);

      const updatedTimesheet = updatedTimesheetData[0];

      return NextResponse.json({
        message: `Timesheet rejected at ${rejectionStage} stage`,
        timesheet: updatedTimesheet
      });

    } catch (error) {
      console.error('Error rejecting timesheet:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  },
  {
    action: 'reject',
    subject: 'Timesheet'
  }
);
