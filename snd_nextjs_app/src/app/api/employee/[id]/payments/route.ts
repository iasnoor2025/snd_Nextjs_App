import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import {
  advancePaymentHistories,
  advancePayments,
  employees as employeesTable,
} from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { and, eq, or } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// Explicit route configuration for Next.js 15
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const getEmployeePaymentsHandler = async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const resolvedParams = await params;
    const employeeId = parseInt(resolvedParams.id);

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    // Get session to check user role
    const session = await getServerSession(authConfig);
    const user = session?.user;

    // For employee users, ensure they can only access their own payment data
    if (user?.national_id) {
      // Find employee record that matches user's national_id
      const ownEmployeeRows = await db
        .select({ id: employeesTable.id })
        .from(employeesTable)
        .where(eq(employeesTable.iqamaNumber, user.national_id))
        .limit(1);

      const ownEmployee = ownEmployeeRows[0];

      if (ownEmployee && employeeId !== ownEmployee.id) {
        return NextResponse.json(
          { error: 'You can only access your own payment data' },
          { status: 403 }
        );
      }
    }

    // Get employee information using Drizzle
    const employeeRows = await db
      .select({
        id: employeesTable.id,
        first_name: employeesTable.firstName,
        last_name: employeesTable.lastName,
      })
      .from(employeesTable)
      .where(eq(employeesTable.id, employeeId))
      .limit(1);

    if (employeeRows.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const employee = employeeRows[0];

    // Get payment history grouped by month using Drizzle
    const paymentHistoryRows = await db
      .select({
        id: advancePaymentHistories.id,
        amount: advancePaymentHistories.amount,
        payment_date: advancePaymentHistories.paymentDate,
        notes: advancePaymentHistories.notes,
        advance_payment_id: advancePaymentHistories.advancePaymentId,
      })
      .from(advancePaymentHistories)
      .where(eq(advancePaymentHistories.employeeId, employeeId))
      .orderBy(advancePaymentHistories.paymentDate);

    // Group payments by month
    const monthlyHistory = paymentHistoryRows.reduce(
      (
        acc: Record<
          string,
          {
            month: string;
            total_amount: number;
            payments: Array<{
              id: number;
              amount: number;
              payment_date: string;
              notes: string | null;
              recorded_by: string;
              advance_payment_id: number;
            }>;
          }
        >,
        payment
      ) => {
        const monthKey = new Date(payment.payment_date).toISOString().slice(0, 7); // YYYY-MM
        const monthName = new Date(payment.payment_date).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        });

        if (!acc[monthKey]) {
          acc[monthKey] = {
            month: monthName,
            total_amount: 0,
            payments: [],
          };
        }

        acc[monthKey].total_amount += Number(payment.amount);
        acc[monthKey].payments.push({
          id: payment.id,
          amount: Number(payment.amount),
          payment_date: payment.payment_date.slice(0, 10), // YYYY-MM-DD
          notes: payment.notes,
          recorded_by: 'System', // TODO: Add user lookup
          advance_payment_id: payment.advance_payment_id,
        });

        return acc;
      },
      {}
    );

    // Flatten all payments from all months
    const payments = (
      Object.values(monthlyHistory) as Array<{ payments: { amount: number }[] }>
    ).flatMap(month => month.payments);

    // Get active advances using Drizzle
    const activeAdvancesRows = await db
      .select({
        id: advancePayments.id,
        amount: advancePayments.amount,
        status: advancePayments.status,
        created_at: advancePayments.createdAt,
      })
      .from(advancePayments)
      .where(
        and(
          eq(advancePayments.employeeId, employeeId),
          or(eq(advancePayments.status, 'approved'), eq(advancePayments.status, 'partially_repaid'))
        )
      )
      .orderBy(advancePayments.createdAt);

    // Calculate summary statistics
    const totalAdvanceAmount = activeAdvancesRows.reduce(
      (sum, advance) => sum + Number(advance.amount),
      0
    );
    const totalPaidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingBalance = totalAdvanceAmount - totalPaidAmount;

    const response = {
      success: true,
      data: {
        employee: {
          id: employee?.id,
          name: `${employee?.first_name} ${employee?.last_name}`,
        },
        summary: {
          total_advance_amount: totalAdvanceAmount,
          total_paid_amount: totalPaidAmount,
          remaining_balance: remainingBalance,
          total_payments: payments.length,
          active_advances: activeAdvancesRows.length,
        },
        monthly_history: Object.values(monthlyHistory),
        payments: payments,
        active_advances: activeAdvancesRows,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to fetch employee payments' }, { status: 500 });
  }
};

// Export the wrapped handler
export const GET = withPermission(PermissionConfigs.employee.read)(getEmployeePaymentsHandler);
