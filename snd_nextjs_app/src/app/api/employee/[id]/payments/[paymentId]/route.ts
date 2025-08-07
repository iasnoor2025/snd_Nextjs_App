import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/rbac/api-middleware';
import { authConfig } from '@/lib/auth-config';

const deleteEmployeePaymentHandler = async (
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

    // Check if payment exists and belongs to the employee
    const payment = await prisma.advancePaymentHistory.findFirst({
      where: {
        id: paymentId,
        employee_id: employeeId,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Get the associated advance payment for recalculation
    const advancePayment = await prisma.advancePayment.findFirst({
      where: { id: payment.advance_payment_id },
    });

    if (!advancePayment) {
      return NextResponse.json({ error: "Associated advance payment not found" }, { status: 404 });
    }

    // Calculate the new repaid amount after deleting this payment
    const newRepaidAmount = Math.max(0, Number(advancePayment.repaid_amount || 0) - Number(payment.amount));
    
    // Determine the new status based on the new repaid amount
    let newStatus = advancePayment.status;
    if (newRepaidAmount <= 0) {
      newStatus = 'approved';
    } else if (newRepaidAmount < Number(advancePayment.amount)) {
      newStatus = 'partially_repaid';
    } else {
      newStatus = 'fully_repaid';
    }

    // Update the advance payment with recalculated values
    await prisma.advancePayment.update({
      where: { id: advancePayment.id },
      data: {
        repaid_amount: newRepaidAmount,
        status: newStatus,
      },
    });

    // Permanently delete the payment
    await prisma.advancePaymentHistory.delete({
      where: { id: paymentId },
    });

    return NextResponse.json({
      success: true,
      message: "Payment deleted successfully",
      recalculated: {
        advance_id: advancePayment.id,
        new_repaid_amount: newRepaidAmount,
        new_status: newStatus,
      },
    });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json(
      { error: "Failed to delete payment" },
      { status: 500 }
    );
  }
};

// Export the wrapped handler
export const DELETE = withAuth(deleteEmployeePaymentHandler); 