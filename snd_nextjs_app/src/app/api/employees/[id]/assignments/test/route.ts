import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { employeeAssignments } from '@/lib/drizzle/schema';
import { eq, and, ne } from 'drizzle-orm';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth-config';

// POST: Manually complete assignments for testing
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const employeeId = parseInt(id);
    if (!employeeId) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    const body = await request.json();
    const { action, date } = body;

    console.log(`[Assignment Test] Testing assignment completion for employee ${employeeId}, action: ${action}, date: ${date}`);

    // First, let's see what assignments exist for this employee
    const existingAssignments = await db
      .select()
      .from(employeeAssignments)
      .where(eq(employeeAssignments.employeeId, employeeId));
    
    console.log(`[Assignment Test] Existing assignments for employee ${employeeId}:`, existingAssignments);

    let updateResult;
    if (action === 'complete_vacation') {
      // For vacation settlements, complete assignments day before vacation starts
      const assignmentEnd = new Date(date);
      assignmentEnd.setDate(assignmentEnd.getDate() - 1);
      const assignmentEndStr = assignmentEnd.toISOString().split('T')[0];
      
      updateResult = await db
        .update(employeeAssignments)
        .set({ status: 'completed', endDate: assignmentEndStr, updatedAt: new Date().toISOString().split('T')[0] })
        .where(
          and(
            eq(employeeAssignments.employeeId, employeeId),
            ne(employeeAssignments.status, 'completed')
          )
        );
    } else if (action === 'complete_exit') {
      // For exit settlements, complete assignments on the last working date
      updateResult = await db
        .update(employeeAssignments)
        .set({ status: 'completed', endDate: date, updatedAt: new Date().toISOString().split('T')[0] })
        .where(
          and(
            eq(employeeAssignments.employeeId, employeeId),
            ne(employeeAssignments.status, 'completed')
          )
        );
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    console.log(`[Assignment Test] Assignment update result for employee ${employeeId}:`, updateResult);

    // Verify the update by fetching assignments again
    const updatedAssignments = await db
      .select()
      .from(employeeAssignments)
      .where(eq(employeeAssignments.employeeId, employeeId));
    
    console.log(`[Assignment Test] Updated assignments for employee ${employeeId}:`, updatedAssignments);

    return NextResponse.json({
      success: true,
      message: 'Assignments completed successfully',
      data: {
        updateResult,
        beforeUpdate: existingAssignments,
        afterUpdate: updatedAssignments,
      },
    });
  } catch (error) {
    console.error('Error completing assignments:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to complete assignments',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
