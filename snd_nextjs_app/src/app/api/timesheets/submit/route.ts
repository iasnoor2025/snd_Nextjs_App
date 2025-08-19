import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { employees, timesheets, users } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { timesheetId, notes } = await _request.json();

    // Get the timesheet with employee and user details
    const timesheetData = await db
      .select({
        id: timesheets.id,
        employeeId: timesheets.employeeId,
        status: timesheets.status,
        hoursWorked: timesheets.hoursWorked,
        overtimeHours: timesheets.overtimeHours,
        date: timesheets.date,
        notes: timesheets.notes,
        submittedAt: timesheets.submittedAt,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
          userId: users.id,
          userName: users.name,
          userEmail: users.email,
        },
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

    // Check if timesheet belongs to the current user's employee record
    const userData = await db
      .select({
        id: users.id,
        employees: {
          id: employees.id,
        },
      })
      .from(users)
      .leftJoin(employees, eq(users.id, employees.userId))
      .where(eq(users.id, parseInt(session.user.id)));

    if (!userData.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is the employee or has permission to submit for others
    const userEmployeeIds = userData.map(emp => emp.employees?.id).filter(Boolean);
    const canSubmit =
      userEmployeeIds.includes(timesheet.employeeId) ||
      session.user.role === 'ADMIN' ||
      session.user.role === 'MANAGER' ||
      session.user.role === 'SUPER_ADMIN';

    if (!canSubmit) {
      return NextResponse.json(
        {
          error:
            'You can only submit your own timesheets or have admin/manager/super_admin permissions',
        },
        { status: 403 }
      );
    }

    // Check if the timesheet is in a state that can be submitted
    if (timesheet.status !== 'draft' && timesheet.status !== 'rejected') {
      return NextResponse.json(
        {
          error: `Timesheet cannot be submitted. Current status: ${timesheet.status}`,
        },
        { status: 400 }
      );
    }

    // Check if there are any hours worked
    const hoursWorked = Number(timesheet.hoursWorked || 0);
    const overtimeHours = Number(timesheet.overtimeHours || 0);
    if (hoursWorked <= 0 && overtimeHours <= 0) {
      return NextResponse.json(
        {
          error: 'Cannot submit timesheet with no hours worked',
        },
        { status: 400 }
      );
    }

    // Check minimum required hours (75% of expected 8 hours per day)
    const workDays = [1, 2, 3, 4, 5]; // Monday to Friday
    const defaultHours = 8;
    const date = new Date(timesheet.date);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

    let minRequiredHours = 0;
    if (workDays.includes(dayOfWeek)) {
      minRequiredHours = defaultHours * 0.75; // 75% of 8 hours = 6 hours
    }

    const totalHours = hoursWorked + overtimeHours;
    if (totalHours < minRequiredHours) {
      return NextResponse.json(
        {
          error: `Insufficient hours submitted. Expected at least ${minRequiredHours} hours for a work day.`,
        },
        { status: 400 }
      );
    }

    // Update timesheet status and submission details
    await db
      .update(timesheets)
      .set({
        status: 'submitted',
        submittedAt: new Date().toISOString().split('T')[0],
        notes: notes || timesheet.notes,
      })
      .where(eq(timesheets.id, parseInt(timesheetId)));

    // Fetch the updated timesheet with details
    const updatedTimesheetData = await db
      .select({
        id: timesheets.id,
        employeeId: timesheets.employeeId,
        status: timesheets.status,
        hoursWorked: timesheets.hoursWorked,
        overtimeHours: timesheets.overtimeHours,
        date: timesheets.date,
        notes: timesheets.notes,
        submittedAt: timesheets.submittedAt,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
          userId: users.id,
          userName: users.name,
          userEmail: users.email,
        },
      })
      .from(timesheets)
      .leftJoin(employees, eq(timesheets.employeeId, employees.id))
      .leftJoin(users, eq(employees.userId, users.id))
      .where(eq(timesheets.id, parseInt(timesheetId)))
      .limit(1);

    const updatedTimesheet = updatedTimesheetData[0];

    return NextResponse.json({
      message: 'Timesheet submitted successfully',
      timesheet: updatedTimesheet,
    });
  } catch (error) {
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
