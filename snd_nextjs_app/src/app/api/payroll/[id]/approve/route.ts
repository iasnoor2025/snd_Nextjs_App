import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: payrollId } = await params;
    const id = parseInt(payrollId);

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

    // Check if payroll can be approved
    if (payroll.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          message: `Payroll is already ${payroll.status} and cannot be approved`
        },
        { status: 400 }
      );
    }

    // Approve the payroll
    const updatedPayroll = await prisma.payroll.update({
      where: { id: id },
      data: {
        status: 'approved',
        approved_by: 1, // Mock user ID - in real app, get from session
        approved_at: new Date(),
        updated_at: new Date()
      },
      include: { employee: true }
    });

    return NextResponse.json({
      success: true,
      data: updatedPayroll,
      message: 'Payroll approved successfully'
    });
  } catch (error) {
    console.error('Error approving payroll:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error approving payroll: ' + (error as Error).message
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
