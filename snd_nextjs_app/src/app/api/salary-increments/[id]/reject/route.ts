import { db } from '@/lib/drizzle';
import { salaryIncrements } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/salary-increments/[id]/reject - Reject salary increment
const rejectSalaryIncrementHandler = async (request: NextRequest, ...args: unknown[]) => {
  try {
    const { params } = args[0] as { params: Promise<{ id: string }> };
    const { id } = await params;
    
    if (isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { rejection_reason, notes } = body;

    // Validate required fields
    if (!rejection_reason) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    // Get current user ID from session (this will be handled by the permission middleware)
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('@/lib/auth-config');
    const session = await getServerSession(authOptions);
    const rejectedBy = session?.user?.id;

    // Check if salary increment exists and can be rejected
    const existingIncrement = await db
      .select({
        id: salaryIncrements.id,
        status: salaryIncrements.status,
      })
      .from(salaryIncrements)
      .where(eq(salaryIncrements.id, parseInt(id)))
      .limit(1);

    if (existingIncrement.length === 0) {
      return NextResponse.json({ error: 'Salary increment not found' }, { status: 404 });
    }

    const increment = existingIncrement[0];

    // Only allow rejection if status is pending
    if (increment.status !== 'pending') {
      return NextResponse.json(
        { error: 'Salary increment cannot be rejected in its current status' },
        { status: 400 }
      );
    }

    // Reject the salary increment
    const [rejectedIncrement] = await db
      .update(salaryIncrements)
      .set({
        status: 'rejected',
        rejectedBy: rejectedBy ? parseInt(rejectedBy) : null,
        rejectedAt: new Date().toISOString(),
        rejectionReason: rejection_reason,
        notes: notes || undefined,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(salaryIncrements.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        id: rejectedIncrement.id,
        employee_id: rejectedIncrement.employeeId,
        increment_type: rejectedIncrement.incrementType,
        effective_date: rejectedIncrement.effectiveDate,
        reason: rejectedIncrement.reason,
        status: rejectedIncrement.status,
        rejected_by: rejectedIncrement.rejectedBy,
        rejected_at: rejectedIncrement.rejectedAt,
        rejection_reason: rejectedIncrement.rejectionReason,
        notes: rejectedIncrement.notes,
        updated_at: rejectedIncrement.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error rejecting salary increment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reject salary increment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};

export const POST = withPermission(PermissionConfigs.salaryIncrement.reject)(rejectSalaryIncrementHandler);
