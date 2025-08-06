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
        deleted_at: null,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Soft delete the payment
    await prisma.advancePaymentHistory.update({
      where: { id: paymentId },
      data: {
        deleted_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment deleted successfully",
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