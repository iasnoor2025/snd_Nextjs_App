import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { advancePaymentHistories, advancePayments, employees } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { and, eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

const deleteEmployeePaymentHandler = async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) => {
  try {
    const resolvedParams = await params;
    const employeeId = parseInt(resolvedParams.id);
    const paymentId = parseInt(resolvedParams.paymentId);

    if (!employeeId || !paymentId) {
      return NextResponse.json(
        { error: 'Employee ID and Payment ID are required' },
        { status: 400 }
      );
    }

    // Get session to check user role
    const session = await getServerSession(authConfig);
    const user = session?.user;

    // For employee users, ensure they can only access their own payment data
    if (user?.national_id) {
      // Find employee record that matches user's national_id using Drizzle
      const ownEmployeeRows = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.iqamaNumber, String(user.national_id)))
        .limit(1);

      if (
        ownEmployeeRows.length > 0 &&
        ownEmployeeRows[0]?.id &&
        employeeId !== ownEmployeeRows[0].id
      ) {
        return NextResponse.json(
          { error: 'You can only access your own payment data' },
          { status: 403 }
        );
      }
    }

    // Check if payment exists and belongs to the employee using Drizzle
    const paymentRows = await db
      .select()
      .from(advancePaymentHistories)
      .where(
        and(
          eq(advancePaymentHistories.id, paymentId),
          eq(advancePaymentHistories.employeeId, employeeId)
        )
      )
      .limit(1);

    if (paymentRows.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const payment = paymentRows[0];

    if (!payment) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    // Get the associated advance payment for recalculation using Drizzle
    const advancePaymentRows = await db
      .select()
      .from(advancePayments)
      .where(eq(advancePayments.id, payment?.advancePaymentId || 0))
      .limit(1);

    if (advancePaymentRows.length === 0) {
      return NextResponse.json({ error: 'Associated advance payment not found' }, { status: 404 });
    }

    const advancePayment = advancePaymentRows[0];

    if (!advancePayment) {
      return NextResponse.json({ error: 'Advance payment not found' }, { status: 404 });
    }

    // Calculate the new repaid amount after deleting this payment
    const newRepaidAmount = Math.max(
      0,
      Number(advancePayment.repaidAmount || 0) - Number(payment.amount)
    );

    // Determine the new status based on the new repaid amount
    let newStatus = advancePayment.status;
    if (newRepaidAmount <= 0) {
      newStatus = 'approved';
    } else if (newRepaidAmount < Number(advancePayment.amount)) {
      newStatus = 'partially_repaid';
    } else {
      newStatus = 'fully_repaid';
    }

    // Update the advance payment with recalculated values using Drizzle
    await db
      .update(advancePayments)
      .set({
        repaidAmount: newRepaidAmount.toString(),
        status: newStatus,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(advancePayments.id, advancePayment.id));

    // Permanently delete the payment using Drizzle
    await db.delete(advancePaymentHistories).where(eq(advancePaymentHistories.id, paymentId));

    return NextResponse.json({
      success: true,
      message: 'Payment deleted successfully',
      recalculated: {
        advance_id: advancePayment.id,
        new_repaid_amount: newRepaidAmount,
        new_status: newStatus,
      },
    });
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
  }
};

// Export the wrapped handler
export const DELETE = withPermission(PermissionConfigs.employee.update)(deleteEmployeePaymentHandler);
