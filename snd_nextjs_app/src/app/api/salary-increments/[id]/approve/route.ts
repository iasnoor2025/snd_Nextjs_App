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

    // Check permission to approve salary increments
    const canApprove = await checkPermission(session.user.id, 'SalaryIncrement', 'approve');
    if (!canApprove) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id } = await params;
    if (isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { notes } = body;

    // Check if salary increment exists and can be approved
    const existingIncrement = await db
      .select({
        id: salaryIncrements.id,
        status: salaryIncrements.status,
        employee_id: salaryIncrements.employeeId,
        effective_date: salaryIncrements.effectiveDate,
      })
      .from(salaryIncrements)
      .where(eq(salaryIncrements.id, parseInt(id)))
      .limit(1);

    if (existingIncrement.length === 0) {
      return NextResponse.json({ error: 'Salary increment not found' }, { status: 404 });
    }

    const increment = existingIncrement[0];

    // Only allow approval if status is pending
    if (increment!.status !== 'pending') {
      return NextResponse.json(
        { error: 'Salary increment cannot be approved in its current status' },
        { status: 400 }
      );
    }

    // Check if effective date is not in the past
    const effectiveDate = new Date(increment!.effective_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison

    if (effectiveDate < today) {
      return NextResponse.json(
        { error: 'Cannot approve salary increment with effective date in the past' },
        { status: 400 }
      );
    }

    // Approve the salary increment
    const [approvedIncrement] = await db
      .update(salaryIncrements)
      .set({
        status: 'approved',
        approvedBy: parseInt(session.user.id),
        approvedAt: new Date().toISOString().split('T')[0],
        notes: notes || undefined,
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .where(eq(salaryIncrements.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        id: approvedIncrement!.id,
        employee_id: approvedIncrement!.employeeId,
        increment_type: approvedIncrement!.incrementType,
        effective_date: approvedIncrement!.effectiveDate,
        reason: approvedIncrement!.reason,
        status: approvedIncrement!.status,
        approved_by: approvedIncrement!.approvedBy,
        approved_at: approvedIncrement!.approvedAt,
        notes: approvedIncrement!.notes,
        updated_at: approvedIncrement!.updatedAt,
      },
    });
  } catch (error) {
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
