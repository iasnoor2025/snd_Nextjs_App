import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { timesheetId, notes } = await request.json();

    // Get the timesheet using any type to bypass TypeScript issues
    const timesheet = await (prisma.timesheet as any).findUnique({
      where: { id: timesheetId },
      include: {
        employee: {
          include: {
            user: true
          }
        }
      }
    });

    if (!timesheet) {
      return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 });
    }

    // Check if timesheet belongs to the current user's employee record
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { employees: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is the employee or has permission to submit for others
    const userEmployeeIds = user.employees.map(emp => emp.id);
    const canSubmit = userEmployeeIds.includes(timesheet.employeeId) ||
                     session.user.role === 'ADMIN' ||
                     session.user.role === 'MANAGER' ||
                     session.user.role === 'SUPER_ADMIN';

    if (!canSubmit) {
      return NextResponse.json({
        error: 'You can only submit your own timesheets or have admin/manager/super_admin permissions'
      }, { status: 403 });
    }

    // Check if the timesheet is in a state that can be submitted
    if (timesheet.status !== 'draft' && timesheet.status !== 'rejected') {
      return NextResponse.json({
        error: `Timesheet cannot be submitted. Current status: ${timesheet.status}`
      }, { status: 400 });
    }

    // Check if there are any hours worked
    const hoursWorked = Number(timesheet.hoursWorked || 0);
    const overtimeHours = Number(timesheet.overtimeHours || 0);
    if (hoursWorked <= 0 && overtimeHours <= 0) {
      return NextResponse.json({
        error: 'Cannot submit timesheet with no hours worked'
      }, { status: 400 });
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
      return NextResponse.json({
        error: `Insufficient hours submitted. Expected at least ${minRequiredHours} hours for a work day.`
      }, { status: 400 });
    }

    // Update timesheet status and submission details
    const updatedTimesheet = await (prisma.timesheet as any).update({
      where: { id: timesheetId },
      data: {
        status: 'submitted',
        submittedAt: new Date(),
        notes: notes || timesheet.notes
      },
      include: {
        employee: {
          include: {
            user: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Timesheet submitted successfully',
      timesheet: updatedTimesheet
    });

  } catch (error) {
    console.error('Error submitting timesheet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
