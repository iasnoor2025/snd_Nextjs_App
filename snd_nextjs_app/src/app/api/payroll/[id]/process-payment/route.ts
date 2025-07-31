import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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

    // Connect to database
    await prisma.$connect();

    // Check if payroll exists
    const payroll = await prisma.payroll.findUnique({
      where: { id: id },
      include: { employee: true }
    });

    if (!payroll) {
      return NextResponse.json(
        {
          success: false,
          message: 'Payroll not found'
        },
        { status: 404 }
      );
    }

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

    // Process the payment
    const updatedPayroll = await prisma.payroll.update({
      where: { id: id },
      data: {
        status: 'paid',
        paid_by: 1, // Mock user ID - in real app, get from session
        paid_at: new Date(),
        payment_method: payment_method,
        payment_reference: reference || null,
        payment_status: 'completed',
        payment_processed_at: new Date(),
        updated_at: new Date()
      },
      include: { employee: true }
    });

    return NextResponse.json({
      success: true,
      data: updatedPayroll,
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
  } finally {
    await prisma.$disconnect();
  }
}
