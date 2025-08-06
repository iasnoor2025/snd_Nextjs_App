import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
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
      const ownEmployee = await prisma.employee.findFirst({
        where: { iqama_number: user.national_id },
        select: { id: true },
      });
      if (ownEmployee && employeeId !== ownEmployee.id) {
        return NextResponse.json(
          { error: "You can only access your own payment data" },
          { status: 403 }
        );
      }
    }

    // Get the payment record
    const paymentRecord = await prisma.advancePaymentHistory.findFirst({
      where: {
        id: paymentId,
        employee_id: employeeId,
        deleted_at: null,
      },
      include: {
        advance_payment: true,
      },
    });

    if (!paymentRecord) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    // Get employee information
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        employee_id: true,
        designation: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!employee) {
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
        id: paymentRecord.id,
        amount: paymentRecord.amount,
        payment_date: paymentRecord.payment_date.toISOString().slice(0, 10), // YYYY-MM-DD
        notes: paymentRecord.notes,
        recorded_by: "System", // TODO: Add user lookup
        created_at: paymentRecord.created_at.toISOString().slice(0, 19).replace('T', ' '), // YYYY-MM-DD HH:MM:SS
      },
      advance: paymentRecord.advance_payment ? {
        id: paymentRecord.advance_payment.id,
        amount: paymentRecord.advance_payment.amount,
        reason: paymentRecord.advance_payment.reason,
        payment_date: paymentRecord.advance_payment.payment_date?.toISOString().slice(0, 10) || null,
        repaid_amount: paymentRecord.advance_payment.repaid_amount,
        balance: Number(paymentRecord.advance_payment.amount) - Number(paymentRecord.advance_payment.repaid_amount || 0),
      } : null,
      employee: {
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        position: employee.designation?.name || "Employee",
        employee_id: employee.employee_id,
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