import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import {
  advancePaymentHistories,
  advancePayments,
  designations,
  employees,
} from '@/lib/drizzle/schema';
import { withAuth } from '@/lib/rbac/api-middleware';
import { and, eq, isNull } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

const getEmployeePaymentReceiptHandler = async (
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
    if (user?.role === 'EMPLOYEE' && user.national_id) {
      // Find employee record that matches user's national_id
      const ownEmployee = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.iqamaNumber, user.national_id))
        .limit(1);
      if (ownEmployee.length > 0 && ownEmployee[0]?.id && employeeId !== ownEmployee[0].id) {
        return NextResponse.json(
          { error: 'You can only access your own payment data' },
          { status: 403 }
        );
      }
    }

    // Get the payment record
    const paymentRecord = await db
      .select({
        id: advancePaymentHistories.id,
        amount: advancePaymentHistories.amount,
        paymentDate: advancePaymentHistories.paymentDate,
        notes: advancePaymentHistories.notes,
        createdAt: advancePaymentHistories.createdAt,
        advancePaymentId: advancePaymentHistories.advancePaymentId,
        advancePayment: {
          id: advancePayments.id,
          amount: advancePayments.amount,
          reason: advancePayments.reason,
          paymentDate: advancePayments.paymentDate,
          repaidAmount: advancePayments.repaidAmount,
        },
      })
      .from(advancePaymentHistories)
      .leftJoin(advancePayments, eq(advancePaymentHistories.advancePaymentId, advancePayments.id))
      .where(
        and(
          eq(advancePaymentHistories.id, paymentId),
          eq(advancePaymentHistories.employeeId, employeeId),
          isNull(advancePaymentHistories.deletedAt)
        )
      )
      .limit(1);

    if (!paymentRecord.length) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    // Get employee information
    const employee = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        fileNumber: employees.fileNumber,
        designation: {
          name: designations.name,
        },
      })
      .from(employees)
      .leftJoin(designations, eq(employees.designationId, designations.id))
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (!employee || employee.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const employeeData = employee[0];

    if (!employeeData) {
      return NextResponse.json({ error: 'Employee data not found' }, { status: 404 });
    }

    // Get company information (you can customize this based on your needs)
    const company = {
      name: process.env.NEXT_PUBLIC_APP_NAME || 'Your Company Name',
      address: process.env.NEXT_PUBLIC_COMPANY_ADDRESS || 'Company Address',
      phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || 'Company Phone',
      email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'company@example.com',
    };

    // Format the receipt data
    if (!paymentRecord || paymentRecord.length === 0) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    const payment = paymentRecord[0];

    if (!payment) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    const receiptData = {
      payment: {
        id: payment.id,
        amount: payment.amount,
        payment_date:
          typeof payment.paymentDate === 'string'
            ? payment.paymentDate.slice(0, 10)
            : new Date(payment.paymentDate).toISOString().slice(0, 10), // YYYY-MM-DD
        notes: payment.notes,
        recorded_by: 'System', // TODO: Add user lookup
        created_at:
          typeof payment.createdAt === 'string'
            ? payment.createdAt.slice(0, 19).replace('T', ' ')
            : new Date(payment.createdAt).toISOString().slice(0, 19).replace('T', ' '), // YYYY-MM-DD HH:MM:SS
      },
      advance: payment.advancePayment
        ? {
            id: payment.advancePayment.id,
            amount: payment.advancePayment.amount,
            reason: payment.advancePayment.reason,
            payment_date: payment.advancePayment.paymentDate
              ? typeof payment.advancePayment.paymentDate === 'string'
                ? payment.advancePayment.paymentDate.slice(0, 10)
                : new Date(payment.advancePayment.paymentDate).toISOString().slice(0, 10)
              : null,
            repaid_amount: payment.advancePayment.repaidAmount,
            balance:
              Number(payment.advancePayment.amount) -
              Number(payment.advancePayment.repaidAmount || 0),
          }
        : null,
      employee: {
        id: employeeData.id,
        name: `${employeeData.firstName} ${employeeData.lastName}`,
        position: employeeData.designation?.name || 'Employee',
        employee_id: employeeData.fileNumber,
      },
      company: company,
    };

    return NextResponse.json({
      success: true,
      receipt: receiptData,
    });
  } catch (error) {
    console.error('Error fetching payment receipt:', error);
    return NextResponse.json({ error: 'Failed to fetch payment receipt' }, { status: 500 });
  }
};

// Export the wrapped handler
export const GET = withAuth(getEmployeePaymentReceiptHandler);
