import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { payroll_ids } = body;

    if (!payroll_ids || !Array.isArray(payroll_ids) || payroll_ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Payroll IDs are required'
        },
        { status: 400 }
      );
    }

    let deletedCount = 0;
    const errors: string[] = [];

    for (const payrollId of payroll_ids) {
      try {
        // Check if payroll exists
        const payroll = await prisma.payroll.findUnique({
          where: { id: payrollId },
          include: { employee: true }
        });

        if (!payroll) {
          errors.push(`Payroll with ID ${payrollId} not found`);
          continue;
        }

        // Check if payroll can be deleted (not paid or processed)
        if (payroll.status === 'paid' || payroll.status === 'processed') {
          errors.push(`Cannot delete payroll ${payrollId} - status is ${payroll.status}`);
          continue;
        }

        // Delete payroll items first (cascade)
        await prisma.payrollItem.deleteMany({
          where: { payroll_id: payrollId }
        });

        // Delete payroll
        await prisma.payroll.delete({
          where: { id: payrollId }
        });

        deletedCount++;
      } catch (error) {
        errors.push(`Error deleting payroll ${payrollId}: ${error}`);
      }
    }

    let message = `Successfully deleted ${deletedCount} payroll(s)`;
    if (errors.length > 0) {
      message += `. ${errors.length} error(s) occurred: ${errors.slice(0, 3).join(', ')}`;
      if (errors.length > 3) {
        message += ` and ${errors.length - 3} more...`;
      }
    }

    return NextResponse.json({
      success: true,
      message: message,
      deleted_count: deletedCount,
      errors: errors
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete payrolls: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}
