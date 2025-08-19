import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { salaryIncrements } from '@/lib/drizzle/schema';
import { checkPermission } from '@/lib/rbac/enhanced-permission-service';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission to reject salary increments
    const canReject = await checkPermission(session.user.id, 'SalaryIncrement', 'update');
    if (!canReject) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

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
    if (increment!.status !== 'pending') {
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
        rejectedBy: parseInt(session.user.id),
        rejectedAt: new Date().toISOString().split('T')[0],
        rejectionReason: rejection_reason,
        notes: notes || undefined,
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .where(eq(salaryIncrements.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        id: rejectedIncrement!.id,
        employee_id: rejectedIncrement!.employeeId,
        increment_type: rejectedIncrement!.incrementType,
        effective_date: rejectedIncrement!.effectiveDate,
        reason: rejectedIncrement!.reason,
        status: rejectedIncrement!.status,
        rejected_by: rejectedIncrement!.rejectedBy,
        rejected_at: rejectedIncrement!.rejectedAt,
        rejection_reason: rejectedIncrement!.rejectionReason,
        notes: rejectedIncrement!.notes,
        updated_at: rejectedIncrement!.updatedAt,
      },
    });
  } catch (error) {
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
