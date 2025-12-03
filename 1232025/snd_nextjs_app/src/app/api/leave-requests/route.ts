
import { db } from '@/lib/drizzle';
import { employeeLeaves, employees } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/leave-requests - Create a new leave request
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await _request.json();
    const { employee_id, leave_type, start_date, end_date, days, reason } = body;

    // Validate required fields
    if (!employee_id || !leave_type || !start_date || !end_date || !days) {
      return NextResponse.json(
        { error: 'Missing required fields: employee_id, leave_type, start_date, end_date, days' },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    if (startDate > endDate) {
      return NextResponse.json({ error: 'Start date cannot be after end date' }, { status: 400 });
    }

    // Check if employee exists
    const [employee] = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        fileNumber: employees.fileNumber,
      })
      .from(employees)
      .where(eq(employees.id, parseInt(employee_id)))
      .limit(1);

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Validate days requested
    const daysRequested = parseInt(days);
    if (isNaN(daysRequested) || daysRequested < 1) {
      return NextResponse.json({ error: 'Invalid days requested' }, { status: 400 });
    }

    // Note: Leave balance check removed - requests are allowed regardless of available balance

    // Create the leave request
    const [leaveRequest] = await db
      .insert(employeeLeaves)
      .values({
        employeeId: parseInt(employee_id),
        leaveType: leave_type,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days: parseInt(days),
        reason: reason || null,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    if (!leaveRequest) {
      return NextResponse.json({ error: 'Failed to create leave request' }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Leave request created successfully',
        data: {
          id: leaveRequest.id,
          employee_name: `${employee.firstName} ${employee.lastName}`,
          employee_id: employee.id,
          leave_type: leaveRequest.leaveType,
          start_date: leaveRequest.startDate,
          end_date: leaveRequest.endDate,
          days: leaveRequest.days,
          reason: leaveRequest.reason,
          status: leaveRequest.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
