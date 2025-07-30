import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig as authOptions } from "@/lib/auth-config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const employeeId = parseInt(resolvedParams.id);

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 }
      );
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
    const monthlyHistory = paymentHistory.reduce((acc, payment) => {
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
        amount: payment.amount,
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
      select: {
        id: true,
        amount: true,
        repaid_amount: true,
        status: true,
        payment_date: true,
        repayment_date: true,
        monthly_deduction: true,
      },
    });

    // Calculate totals
    const totalMonthlyDeduction = activeAdvances.reduce((sum, advance) => 
      sum + Number(advance.monthly_deduction || 0), 0
    );
    
    const totalRemainingBalance = activeAdvances.reduce((sum, advance) => {
      const remaining = Number(advance.amount) - Number(advance.repaid_amount || 0);
      return sum + remaining;
    }, 0);

    return NextResponse.json({
      success: true,
      payments: payments,
      active_advances: activeAdvances.map(advance => ({
        id: advance.id,
        amount: advance.amount,
        repaid_amount: advance.repaid_amount,
        balance: Number(advance.amount) - Number(advance.repaid_amount || 0),
        status: advance.status,
        payment_date: advance.payment_date?.toISOString().slice(0, 10) || null,
        repayment_date: advance.repayment_date?.toISOString().slice(0, 10) || null,
        monthly_deduction: advance.monthly_deduction,
      })),
      employee: {
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        total_advance_balance: totalRemainingBalance, // Calculate from active advances
      },
      totals: {
        monthly_deduction: totalMonthlyDeduction,
        remaining_balance: totalRemainingBalance
      }
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
} 