import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    // Connect to database
    await prisma.$connect();

    // Get payroll with employee and items
    const payroll = await prisma.payroll.findUnique({
      where: { id: id },
      include: {
        employee: true,
        items: {
          orderBy: { order: 'asc' }
        }
      }
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

    return NextResponse.json({
      success: true,
      data: payroll,
      message: 'Payroll retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving payroll:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error retrieving payroll: ' + (error as Error).message
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const body = await request.json();
    const { base_salary, overtime_amount, bonus_amount, deduction_amount, advance_deduction, notes, status } = body;

    // Connect to database
    await prisma.$connect();

    // Check if payroll exists
    const existingPayroll = await prisma.payroll.findUnique({
      where: { id: id },
      include: { employee: true }
    });

    if (!existingPayroll) {
      return NextResponse.json(
        {
          success: false,
          message: 'Payroll not found'
        },
        { status: 404 }
      );
    }

    // Helper function to validate numeric values
    const isValidNumber = (value: any): boolean => {
      return value !== undefined && value !== null && !isNaN(Number(value));
    };

    // Calculate final amount
    const finalAmount = (isValidNumber(base_salary) ? base_salary : existingPayroll.base_salary) + 
                       (isValidNumber(overtime_amount) ? overtime_amount : existingPayroll.overtime_amount) + 
                       (isValidNumber(bonus_amount) ? bonus_amount : existingPayroll.bonus_amount) - 
                       (isValidNumber(deduction_amount) ? deduction_amount : existingPayroll.deduction_amount) - 
                       (isValidNumber(advance_deduction) ? advance_deduction : existingPayroll.advance_deduction);

    // Update payroll
    const updatedPayroll = await prisma.payroll.update({
      where: { id: id },
      data: {
        base_salary: isValidNumber(base_salary) ? base_salary : existingPayroll.base_salary,
        overtime_amount: isValidNumber(overtime_amount) ? overtime_amount : existingPayroll.overtime_amount,
        bonus_amount: isValidNumber(bonus_amount) ? bonus_amount : existingPayroll.bonus_amount,
        deduction_amount: isValidNumber(deduction_amount) ? deduction_amount : existingPayroll.deduction_amount,
        advance_deduction: isValidNumber(advance_deduction) ? advance_deduction : existingPayroll.advance_deduction,
        final_amount: finalAmount,
        notes: notes !== undefined ? notes : existingPayroll.notes,
        status: status !== undefined ? status : existingPayroll.status,
        updated_at: new Date()
      },
      include: {
        employee: true,
        items: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedPayroll,
      message: 'Payroll updated successfully'
    });
  } catch (error) {
    console.error('Error updating payroll:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error updating payroll: ' + (error as Error).message
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

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

    // Check if payroll is paid - if so, prevent deletion
    if (payroll.status === 'paid') {
      return NextResponse.json(
        {
          success: false,
          message: 'Cannot delete paid payroll'
        },
        { status: 400 }
      );
    }

    // Delete payroll items first (cascade)
    await prisma.payrollItem.deleteMany({
      where: { payroll_id: id }
    });

    // Delete payroll
    await prisma.payroll.delete({
      where: { id: id }
    });

    return NextResponse.json({
      success: true,
      message: 'Payroll deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payroll:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error deleting payroll: ' + (error as Error).message
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
