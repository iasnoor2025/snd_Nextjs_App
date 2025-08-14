import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { advancePayments, advancePaymentHistories } from '@/lib/drizzle/schema';
import { eq, and, isNull, asc } from 'drizzle-orm';

// Explicit route configuration for Next.js 15
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';



// Additional route configuration for Next.js 15
export const runtime = 'nodejs';
export const preferredRegion = 'auto';



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

    // Check if advance exists and is approved using Drizzle
    const advanceRows = await db
      .select()
      .from(advancePayments)
      .where(eq(advancePayments.id, advanceId))
      .limit(1);

    if (advanceRows.length === 0) {
      return NextResponse.json({ error: "Advance not found" }, { status: 404 });
    }

    const advance = advanceRows[0];

    if (advance.status !== "approved" && advance.status !== "partially_repaid") {
      return NextResponse.json(
        { error: "Only approved and partially repaid advances can be repaid" },
        { status: 400 }
      );
    }

    const repaymentAmountNum = parseFloat(repaymentAmount);
    const advanceAmount = parseFloat(advance.amount.toString());
    const monthlyDeduction = advance.monthlyDeduction ? parseFloat(advance.monthlyDeduction) : 0;

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
    const currentRepaidAmount = advance.repaidAmount ? parseFloat(advance.repaidAmount) : 0;
    const remainingBalance = advanceAmount - currentRepaidAmount;

    if (repaymentAmountNum > remainingBalance) {
      return NextResponse.json(
        { error: "Repayment amount cannot exceed the remaining balance" },
        { status: 400 }
      );
    }

    // Get all active advances for this employee, ordered by remaining balance (lowest first) using Drizzle
    const activeAdvancesRows = await db
      .select()
      .from(advancePayments)
      .where(
        and(
          eq(advancePayments.employeeId, advance.employeeId),
          and(
            eq(advancePayments.status, 'approved'),
            isNull(advancePayments.deletedAt)
          )
        )
      )
      .orderBy(asc(advancePayments.amount));

    const activeAdvances = activeAdvancesRows;

    // Calculate total remaining balance
    const totalRemainingBalance = activeAdvances.reduce((sum, adv) => {
      const remaining = Number(adv.amount) - Number(adv.repaidAmount || 0);
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
    const paymentDate = new Date().toISOString();
    const notes = `Repayment of SAR ${repaymentAmountNum.toFixed(2)}`;

    for (const activeAdvance of activeAdvances) {
      if (remainingRepaymentAmount <= 0) break;

      const currentRepaidAmount = Number(activeAdvance.repaidAmount || 0);
      const remainingBalance = Number(activeAdvance.amount) - currentRepaidAmount;
      const amountForThisAdvance = Math.min(remainingRepaymentAmount, remainingBalance);

      if (amountForThisAdvance <= 0) continue;

      // Update the advance payment using Drizzle
      const newRepaidAmount = currentRepaidAmount + amountForThisAdvance;
      const newStatus = newRepaidAmount >= Number(activeAdvance.amount) ? "fully_repaid" : "partially_repaid";

      await db
        .update(advancePayments)
        .set({
          repaidAmount: newRepaidAmount.toString(),
          status: newStatus,
          repaymentDate: paymentDate,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(advancePayments.id, activeAdvance.id));

      // Create a payment history record for tracking using Drizzle
      await db
        .insert(advancePaymentHistories)
        .values({
          employeeId: activeAdvance.employeeId,
          advancePaymentId: activeAdvance.id,
          amount: amountForThisAdvance.toString(),
          paymentDate: paymentDate,
          notes: notes,
          recordedBy: parseInt(session.user.id),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

      remainingRepaymentAmount -= amountForThisAdvance;
    }

    // Get the updated advance for response using Drizzle
    const updatedAdvanceRows = await db
      .select()
      .from(advancePayments)
      .where(eq(advancePayments.id, advanceId))
      .limit(1);

    const updatedAdvance = updatedAdvanceRows[0];

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