import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from 'next-auth';
import { db } from '@/lib/drizzle';
import { employees, advancePaymentHistories, advancePayments, designations } from '@/lib/drizzle/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { withAuth } from '@/lib/rbac/api-middleware';
import { authConfig } from '@/lib/auth-config';

const getEmployeePaymentReceiptHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) => {
  try {
    const resolvedParams = await params;
    const employeeId = parseInt(resolvedParams.id);
    const paymentId = parseInt(resolvedParams.paymentId);

    if (!employeeId || !paymentId) {
      return NextResponse.json(
        { error: "Employee ID and Payment ID are required" },
        { status: 400 }
      );
    }

    // Get session to check user role
    const session = await getServerSession(authConfig);
    const user = session?.user;
    
    // For employee users, ensure they can only access their own payment data
    if (user?.role === 'EMPLOYEE') {
      // Find employee record that matches user's national_id
      const ownEmployee = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.iqamaNumber, user.national_id))
        .limit(1);
      if (ownEmployee.length && employeeId !== ownEmployee[0].id) {
        return NextResponse.json(
          { error: "You can only access your own payment data" },
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
          repaidAmount: advancePayments.repaidAmount
        }
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
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    // Get employee information
    const employee = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        fileNumber: employees.fileNumber,
        designation: {
          name: designations.name
        }
      })
      .from(employees)
      .leftJoin(designations, eq(employees.designationId, designations.id))
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (!employee.length) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Get company information (you can customize this based on your needs)
    const company = {
      name: process.env.NEXT_PUBLIC_APP_NAME || "Your Company Name",
      address: process.env.NEXT_PUBLIC_COMPANY_ADDRESS || "Company Address",
      phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || "Company Phone",
      email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || "company@example.com",
    };

    // Format the receipt data
    const receiptData = {
      payment: {
        id: paymentRecord[0].id,
        amount: paymentRecord[0].amount,
        payment_date: typeof paymentRecord[0].paymentDate === 'string' ? paymentRecord[0].paymentDate.slice(0, 10) : new Date(paymentRecord[0].paymentDate).toISOString().slice(0, 10), // YYYY-MM-DD
        notes: paymentRecord[0].notes,
        recorded_by: "System", // TODO: Add user lookup
        created_at: typeof paymentRecord[0].createdAt === 'string' ? paymentRecord[0].createdAt.slice(0, 19).replace('T', ' ') : new Date(paymentRecord[0].createdAt).toISOString().slice(0, 19).replace('T', ' '), // YYYY-MM-DD HH:MM:SS
      },
      advance: paymentRecord[0].advancePayment ? {
        id: paymentRecord[0].advancePayment.id,
        amount: paymentRecord[0].advancePayment.amount,
        reason: paymentRecord[0].advancePayment.reason,
        payment_date: paymentRecord[0].advancePayment.paymentDate ? (typeof paymentRecord[0].advancePayment.paymentDate === 'string' ? paymentRecord[0].advancePayment.paymentDate.slice(0, 10) : new Date(paymentRecord[0].advancePayment.paymentDate).toISOString().slice(0, 10)) : null,
        repaid_amount: paymentRecord[0].advancePayment.repaidAmount,
        balance: Number(paymentRecord[0].advancePayment.amount) - Number(paymentRecord[0].advancePayment.repaidAmount || 0),
      } : null,
      employee: {
        id: employee[0].id,
        name: `${employee[0].firstName} ${employee[0].lastName}`,
        position: employee[0].designation?.name || "Employee",
        employee_id: employee[0].fileNumber,
      },
      company: company,
    };

    return NextResponse.json({
      success: true,
      receipt: receiptData,
    });
  } catch (error) {
    console.error("Error fetching payment receipt:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment receipt" },
      { status: 500 }
    );
  }
};

// Export the wrapped handler
export const GET = withAuth(getEmployeePaymentReceiptHandler); 