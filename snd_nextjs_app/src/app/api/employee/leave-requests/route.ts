import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { employeeLeaves } from '@/lib/drizzle/schema';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user has EMPLOYEE role
    if (session.user.role !== 'EMPLOYEE') {
      return NextResponse.json(
        { error: 'Access denied. Employee role required.' },
        { status: 403 }
      );
    }

    const body = await _request.json();
    // Support both field names for compatibility
    const employee_id = body.employee_id || body.employeeId;
    const { leave_type, start_date, end_date, reason } = body;

    // Validate required fields
    if (!employee_id || !leave_type || !start_date || !end_date) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: employee_id/employeeId, leave_type, start_date, and end_date are required',
        },
        { status: 400 }
      );
    }

    // Calculate number of days
    const start = new Date(start_date);
    const end = new Date(end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Create leave request using Drizzle
    const leaveRequestRows = await db
      .insert(employeeLeaves)
      .values({
        employeeId: parseInt(employee_id),
        leaveType: leave_type,
        startDate: new Date(start_date).toISOString(),
        endDate: new Date(end_date).toISOString(),
        reason: reason || '',
        days: days,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    const leaveRequest = leaveRequestRows[0];

    return NextResponse.json({
      message: 'Leave request submitted successfully',
      leaveRequest,
    });
  } catch (error) {
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
