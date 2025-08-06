import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/db';
import { withEmployeeOwnDataAccess } from '@/lib/rbac/api-middleware';

const getEmployeePaymentsHandler = async (
  request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } },
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const resolvedParams = await params;
    const employeeId = parseInt(resolvedParams.id);

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 }
      );
    }

    // For employee users, ensure they can only access their own payment data
    if (request.employeeAccess?.ownEmployeeId) {
      if (employeeId !== request.employeeAccess.ownEmployeeId) {
        return NextResponse.json(
          { error: "You can only access your own payment data" },
          { status: 403 }
        );
      }
    }

    // Get employee information
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Get payment history grouped by month
    const paymentHistory = await prisma.advancePaymentHistory.findMany({
      where: {
        employee_id: employeeId,
        deleted_at: null,
      },
      orderBy: {
        payment_date: "desc",
      },
      include: {
        advance_payment: true,
      },
    });

    // Group payments by month
    const monthlyHistory = paymentHistory.reduce((acc: Record<string, {
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
    }>, payment) => {
      const monthKey = new Date(payment.payment_date).toISOString().slice(0, 7); // YYYY-MM
      const monthName = new Date(payment.payment_date).toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });

      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthName,
          total_amount: 0,
          payments: []
        };
      }

      acc[monthKey].total_amount += Number(payment.amount);
      acc[monthKey].payments.push({
        id: payment.id,
        amount: Number(payment.amount),
        payment_date: payment.payment_date.toISOString().slice(0, 10), // YYYY-MM-DD
        notes: payment.notes,
        recorded_by: 'System', // TODO: Add user lookup
        advance_payment_id: payment.advance_payment_id,
      });

      return acc;
    }, {});

    // Flatten all payments from all months
    const payments = Object.values(monthlyHistory).flatMap(month => month.payments);

    // Get active advances
    const activeAdvances = await prisma.advancePayment.findMany({
      where: {
        employee_id: employeeId,
        status: { in: ['approved', 'partially_repaid'] },
        deleted_at: null,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Calculate summary statistics
    const totalAdvanceAmount = activeAdvances.reduce((sum, advance) => sum + Number(advance.amount), 0);
    const totalPaidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingBalance = totalAdvanceAmount - totalPaidAmount;

    return NextResponse.json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          name: `${employee.first_name} ${employee.last_name}`,
        },
        summary: {
          total_advance_amount: totalAdvanceAmount,
          total_paid_amount: totalPaidAmount,
          remaining_balance: remainingBalance,
          total_payments: payments.length,
          active_advances: activeAdvances.length,
        },
        monthly_history: Object.values(monthlyHistory),
        payments: payments,
        active_advances: activeAdvances,
      },
    });
  } catch (error) {
    console.error('Error fetching employee payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee payments' },
      { status: 500 }
    );
  }
};

// Export the wrapped handler
export const GET = withEmployeeOwnDataAccess(getEmployeePaymentsHandler); 