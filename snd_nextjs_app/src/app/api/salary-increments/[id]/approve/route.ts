import { db } from '@/lib/drizzle';
import { salaryIncrements } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/salary-increments/[id]/approve - Approve salary increment
const approveSalaryIncrementHandler = async (request: NextRequest, ...args: unknown[]) => {
  try {
    const { params } = args[0] as { params: Promise<{ id: string }> };
    const { id } = await params;
    
    if (isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { notes } = body;

    // Get current user ID from session (this will be handled by the permission middleware)
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('@/lib/auth-config');
    const session = await getServerSession(authOptions);
    const approvedBy = session?.user?.id;

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
    if (increment.status !== 'pending') {
      return NextResponse.json(
        { error: 'Salary increment cannot be approved in its current status' },
        { status: 400 }
      );
    }

    // Check if effective date is not in the past
    const effectiveDate = new Date(increment.effective_date);
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
        approvedBy: approvedBy ? parseInt(approvedBy) : null,
        approvedAt: new Date().toISOString(),
        notes: notes || undefined,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(salaryIncrements.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        id: approvedIncrement.id,
        employee_id: approvedIncrement.employeeId,
        increment_type: approvedIncrement.incrementType,
        effective_date: approvedIncrement.effectiveDate,
        reason: approvedIncrement.reason,
        status: approvedIncrement.status,
        approved_by: approvedIncrement.approvedBy,
        approved_at: approvedIncrement.approvedAt,
        notes: approvedIncrement.notes,
        updated_at: approvedIncrement.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error approving salary increment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to approve salary increment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};

export const POST = withPermission(PermissionConfigs.salaryIncrement.approve)(approveSalaryIncrementHandler);
