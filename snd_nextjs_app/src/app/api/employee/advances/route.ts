import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { advancePayments, employees as employeesTable } from '@/lib/drizzle/schema';
import { eq, isNull } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

// Explicit route configuration for Next.js 15
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Additional route configuration for Next.js 15
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

export async function GET(_request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(_request.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    // Check if user has permission to view this employee's advances
    if (session.user.national_id) {
      // For employees, they can only view their own advances
      const employeeRows = await db
        .select({ id: employeesTable.id })
        .from(employeesTable)
        .where(eq(employeesTable.iqamaNumber, session.user.national_id))
        .limit(1);

      const employee = employeeRows[0];

      if (!employee || employee.id !== parseInt(employeeId)) {
        
        return NextResponse.json(
          { error: 'Access denied. You can only view your own advances.' },
          { status: 403 }
        );
      }
    }

    // Fetch advances for the specified employee using Drizzle
    const advancesRows = await db
      .select({
        id: advancePayments.id,
        amount: advancePayments.amount,
        purpose: advancePayments.purpose,
        reason: advancePayments.reason,
        status: advancePayments.status,
        created_at: advancePayments.createdAt,
        monthly_deduction: advancePayments.monthlyDeduction,
        repaid_amount: advancePayments.repaidAmount,
        employee_id: advancePayments.employeeId,
      })
      .from(advancePayments)
      .where(
        eq(advancePayments.employeeId, parseInt(employeeId)) && isNull(advancePayments.deletedAt)
      )
      .orderBy(advancePayments.createdAt);

    const responseData = {
      success: true,
      advances: advancesRows.map(advance => ({
        id: advance.id,
        amount: Number(advance.amount),
        reason: advance.reason || advance.purpose,
        status: advance.status,
        created_at: advance.created_at,
        monthly_deduction: advance.monthly_deduction ? Number(advance.monthly_deduction) : null,
        repaid_amount: Number(advance.repaid_amount),
        remaining_balance: Number(advance.amount) - Number(advance.repaid_amount),
        type: 'advance',
      })),
    };

    return NextResponse.json(responseData);
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

export const POST = withPermission(PermissionConfigs.advance.create)(async (_request: NextRequest) => {
  try {
    // Get the current user session
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await _request.json();
    // Support both field names for compatibility
    const employee_id = body.employee_id || body.employeeId;
    const amount = body.amount;
    const reason = body.reason;
    const monthly_deduction = body.monthly_deduction;

    // Validate required fields
    if (!employee_id || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: employee_id/employeeId and amount are required' },
        { status: 400 }
      );
    }

    // Validate amount
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Validate monthly deduction if provided
    let monthlyDeductionValue: string | null = null;
    if (monthly_deduction) {
      const parsed = parseFloat(monthly_deduction);
      if (isNaN(parsed) || parsed < 0) {
        return NextResponse.json({ error: 'Invalid monthly deduction amount' }, { status: 400 });
      }
      monthlyDeductionValue = parsed.toString();
    }

    // Create advance request using Drizzle
    const advanceRows = await db
      .insert(advancePayments)
      .values({
        employeeId: employee_id,
        amount: amountValue.toString(),
        purpose: reason || '',
        status: 'pending',
        repaidAmount: '0',
        monthlyDeduction: monthlyDeductionValue,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    const advance = advanceRows[0];

    return NextResponse.json({
      message: 'Advance request submitted successfully',
      advance,
    });
  } catch (error) {
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
