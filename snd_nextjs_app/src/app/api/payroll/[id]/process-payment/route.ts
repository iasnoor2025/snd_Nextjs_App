import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payrolls, employees } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: payrollId } = await params;
    const id = parseInt(payrollId);
    const body = await request.json();
    const { payment_method, reference } = body;

    // Validate required fields
    if (!payment_method) {
      return NextResponse.json(
        {
          success: false,
          message: 'Payment method is required'
        },
        { status: 400 }
      );
    }

    // Check if payroll exists using Drizzle
    const payrollRows = await db
      .select()
      .from(payrolls)
      .where(eq(payrolls.id, id))
      .limit(1);

    if (payrollRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Payroll not found'
        },
        { status: 404 }
      );
    }

    const payroll = payrollRows[0];

    // Check if payroll can be processed
    if (payroll.status !== 'approved') {
      return NextResponse.json(
        {
          success: false,
          message: `Payroll must be approved before payment can be processed. Current status: ${payroll.status}`
        },
        { status: 400 }
      );
    }

    // Process the payment using Drizzle
    const updatedPayrollRows = await db
      .update(payrolls)
      .set({
        status: 'paid',
        paidBy: 1, // Mock user ID - in real app, get from session
        paidAt: new Date().toISOString(),
        paymentMethod: payment_method,
        paymentReference: reference || null,
        paymentStatus: 'completed',
        paymentProcessedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .where(eq(payrolls.id, id))
      .returning();

    const updatedPayroll = updatedPayrollRows[0];

    // Get employee data using Drizzle
    const employeeRows = await db
      .select()
      .from(employees)
      .where(eq(employees.id, updatedPayroll.employeeId))
      .limit(1);

    const employee = employeeRows[0] || null;

    // Format response to match expected structure
    const formattedUpdatedPayroll = {
      ...updatedPayroll,
      employee
    };

    return NextResponse.json({
      success: true,
      data: formattedUpdatedPayroll,
      message: 'Payment processed successfully'
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error processing payment: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}
