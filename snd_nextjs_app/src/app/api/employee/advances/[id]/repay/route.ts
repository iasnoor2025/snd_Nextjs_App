import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("POST /api/employee/advances/[id]/repay called");
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("Unauthorized - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { repaymentAmount } = body;

    if (!repaymentAmount || parseFloat(repaymentAmount) <= 0) {
      return NextResponse.json(
        { error: "Valid repayment amount is required" },
        { status: 400 }
      );
    }

    const resolvedParams = await params;
    const advanceId = parseInt(resolvedParams.id);
    if (!advanceId) {
      return NextResponse.json({ error: "Invalid advance ID" }, { status: 400 });
    }

    // Check if advance exists and is approved
    const advance = await prisma.advancePayment.findUnique({
      where: { id: advanceId },
    });

    if (!advance) {
      return NextResponse.json({ error: "Advance not found" }, { status: 404 });
    }

    if (advance.status !== "approved" && advance.status !== "partially_repaid") {
      return NextResponse.json(
        { error: "Only approved and partially repaid advances can be repaid" },
        { status: 400 }
      );
    }

    const repaymentAmountNum = parseFloat(repaymentAmount);
    const advanceAmount = parseFloat(advance.amount.toString());
    const monthlyDeduction = advance.monthly_deduction ? parseFloat(advance.monthly_deduction.toString()) : 0;

    // Validate minimum repayment amount
    if (monthlyDeduction > 0 && repaymentAmountNum < monthlyDeduction) {
      return NextResponse.json(
        { error: `Repayment amount must be at least the monthly deduction (SAR ${monthlyDeduction.toFixed(2)})` },
        { status: 400 }
      );
    }

    // Check if repayment amount exceeds the advance amount
    if (repaymentAmountNum > advanceAmount) {
      return NextResponse.json(
        { error: "Repayment amount cannot exceed the advance amount" },
        { status: 400 }
      );
    }

    // Calculate remaining balance
    const currentRepaidAmount = advance.repaid_amount ? parseFloat(advance.repaid_amount.toString()) : 0;
    const remainingBalance = advanceAmount - currentRepaidAmount;

    if (repaymentAmountNum > remainingBalance) {
      return NextResponse.json(
        { error: "Repayment amount cannot exceed the remaining balance" },
        { status: 400 }
      );
    }

    // Get all active advances for this employee, ordered by remaining balance (lowest first)
    const activeAdvances = await prisma.advancePayment.findMany({
      where: {
        employee_id: advance.employee_id,
        status: { in: ['approved', 'partially_repaid'] },
        deleted_at: null,
      },
      orderBy: {
        // Order by remaining balance (lowest first)
        amount: 'asc',
      },
    });

    // Calculate total remaining balance
    const totalRemainingBalance = activeAdvances.reduce((sum, adv) => {
      const remaining = Number(adv.amount) - Number(adv.repaid_amount || 0);
      return sum + remaining;
    }, 0);

    // Validate the repayment amount
    if (repaymentAmountNum > totalRemainingBalance) {
      return NextResponse.json(
        { error: `Repayment amount cannot exceed the total remaining balance of SAR ${totalRemainingBalance.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Process the repayment - distribute across advances (smallest balance first)
    let remainingRepaymentAmount = repaymentAmountNum;
    const paymentDate = new Date();
    const notes = `Repayment of SAR ${repaymentAmountNum.toFixed(2)}`;

    for (const activeAdvance of activeAdvances) {
      if (remainingRepaymentAmount <= 0) break;

      const currentRepaidAmount = Number(activeAdvance.repaid_amount || 0);
      const remainingBalance = Number(activeAdvance.amount) - currentRepaidAmount;
      const amountForThisAdvance = Math.min(remainingRepaymentAmount, remainingBalance);

      if (amountForThisAdvance <= 0) continue;

      // Update the advance payment
      const newRepaidAmount = currentRepaidAmount + amountForThisAdvance;
      const newStatus = newRepaidAmount >= Number(activeAdvance.amount) ? "fully_repaid" : "partially_repaid";

      await prisma.advancePayment.update({
        where: { id: activeAdvance.id },
        data: {
          repaid_amount: newRepaidAmount,
          status: newStatus,
          repayment_date: paymentDate,
        },
      });

      // Create a payment history record for tracking
      await prisma.advancePaymentHistory.create({
        data: {
          employee_id: activeAdvance.employee_id,
          advance_payment_id: activeAdvance.id,
          amount: amountForThisAdvance,
          payment_date: paymentDate,
          notes: notes,
          recorded_by: parseInt(session.user.id),
        },
      });

      remainingRepaymentAmount -= amountForThisAdvance;
    }

    // Get the updated advance for response
    const updatedAdvance = await prisma.advancePayment.findUnique({
      where: { id: advanceId },
    });

    console.log("Repayment recorded successfully:", updatedAdvance);

    return NextResponse.json({
      success: true,
      advance: updatedAdvance,
      message: "Repayment recorded successfully",
    });
  } catch (error) {
    console.error("Error recording repayment:", error);
    return NextResponse.json(
      { error: `Failed to record repayment: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 