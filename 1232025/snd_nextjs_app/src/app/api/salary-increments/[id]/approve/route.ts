import { db } from '@/lib/drizzle';
import { salaryIncrements } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

// POST /api/salary-increments/[id]/approve - Approve salary increment
const approveSalaryIncrementHandler = async (request: NextRequest, ...args: unknown[]) => {
  try {
    const { params } = args[0] as { params: Promise<{ id: string }> };
    const { id } = await params;
    
    if (isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Parse request body (may be empty)
    let notes: string | undefined;
    try {
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const body = await request.json().catch(() => ({}));
        notes = body.notes;
      }
    } catch (error) {
      // Body is optional, continue without notes
      console.log('[APPROVE] Body parsing skipped:', error);
    }

    // Get current user ID from session (this will be handled by the permission middleware)
    const session = await getServerSession();
    const approvedBy = session?.user?.id;

    if (!approvedBy) {
      return NextResponse.json({ error: 'User session not found' }, { status: 401 });
    }

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
      console.log('[APPROVE] Status check failed:', increment.status);
      return NextResponse.json(
        { 
          success: false,
          error: 'Salary increment cannot be approved in its current status',
          details: `Current status: ${increment.status}. Only pending increments can be approved.`
        },
        { status: 400 }
      );
    }

    // Note: We allow past effective dates for retroactive salary increment approvals
    // This is common in business scenarios where increments need to be applied retroactively

    // Format dates to YYYY-MM-DD format for date type fields
    const approvedAtFormatted = new Date().toISOString().split('T')[0];
    const updatedAtFormatted = new Date().toISOString().split('T')[0];

    // Approve the salary increment
    const [approvedIncrement] = await db
      .update(salaryIncrements)
      .set({
        status: 'approved',
        approvedBy: parseInt(approvedBy),
        approvedAt: approvedAtFormatted,
        notes: notes || undefined,
        updatedAt: updatedAtFormatted,
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
