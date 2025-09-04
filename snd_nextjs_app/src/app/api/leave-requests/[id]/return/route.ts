import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { employeeLeaves, employees } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

export const PUT = withPermission(PermissionConfigs.leave.update)(async (request: NextRequest) => {
  try {
    // Extract id from URL params
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2]; // Get id from /api/leave-requests/[id]/return
    
    if (!id) {
      return NextResponse.json({ error: 'Leave request ID is required' }, { status: 400 });
    }
    
    const session = await getServerSession(authConfig);
    const body = await request.json();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { return_date, return_reason } = body;

    // Validate required fields
    if (!return_date) {
      return NextResponse.json({ error: 'Return date is required' }, { status: 400 });
    }

    if (!return_reason) {
      return NextResponse.json({ error: 'Return reason is required' }, { status: 400 });
    }

    // Find the leave request
    const leaveRequestData = await db
      .select({
        id: employeeLeaves.id,
        startDate: employeeLeaves.startDate,
        endDate: employeeLeaves.endDate,
        status: employeeLeaves.status,
        days: employeeLeaves.days,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
        },
      })
      .from(employeeLeaves)
      .leftJoin(employees, eq(employeeLeaves.employeeId, employees.id))
      .where(eq(employeeLeaves.id, parseInt(id)))
      .limit(1);

    const leaveRequest = leaveRequestData[0];
    if (!leaveRequest) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    // Only allow return for approved leave requests
    if (leaveRequest.status !== 'approved') {
      return NextResponse.json(
        { error: 'Only approved leave requests can be marked as returned' },
        { status: 400 }
      );
    }

    // Validate return date
    const returnDate = new Date(return_date);
    const startDate = new Date(leaveRequest.startDate);
    const originalEndDate = new Date(leaveRequest.endDate);

    if (returnDate < startDate) {
      return NextResponse.json(
        { error: 'Return date cannot be before leave start date' },
        { status: 400 }
      );
    }

    // Simple logic: Return date becomes the effective end date
    // Calculate actual days taken from start date to return date
    const actualDaysTaken = Math.ceil(
      (returnDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    // Determine if it's an early return (before original end date) or extended (after original end date)
    const isEarlyReturn = returnDate < originalEndDate;
    const isExtended = returnDate > originalEndDate;
    const newStatus = 'returned'; // Always mark as returned when employee returns

    // Update the leave request - return date becomes the effective end date
    await db
      .update(employeeLeaves)
      .set({
        returnDate: returnDate.toISOString(),
        returnedBy: parseInt(session.user.id),
        returnReason: return_reason,
        status: newStatus,
        days: actualDaysTaken, // Update the days field with actual days taken
        endDate: returnDate.toISOString(), // Set return date as the new end date
        updatedAt: new Date().toISOString(),
      })
      .where(eq(employeeLeaves.id, parseInt(id)));

    return NextResponse.json({
      success: true,
      message: 'Employee returned successfully',
      data: {
        id: parseInt(id),
        return_date: returnDate.toISOString(),
        return_reason: return_reason,
        status: newStatus,
        is_early_return: isEarlyReturn,
        is_extended: isExtended,
        actual_days_taken: actualDaysTaken,
        original_days_requested: leaveRequest.days,
        original_end_date: originalEndDate.toISOString(),
        new_end_date: returnDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error returning employee:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
