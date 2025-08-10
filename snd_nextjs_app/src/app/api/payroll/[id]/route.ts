import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payrolls, payrollItems, employees } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    // Get payroll with employee and items using Drizzle
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

    // Get payroll items using Drizzle
    const payrollItemsRows = await db
      .select()
      .from(payrollItems)
      .where(eq(payrollItems.payrollId, id))
      .orderBy(payrollItems.order);

    // Get employee data using Drizzle
    const employeeRows = await db
      .select()
      .from(employees)
      .where(eq(employees.id, payroll.employeeId))
      .limit(1);

    const employee = employeeRows[0] || null;

    // Format response to match expected structure
    const formattedPayroll = {
      ...payroll,
      employee,
      items: payrollItemsRows
    };

    return NextResponse.json({
      success: true,
      data: formattedPayroll,
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

    // Check if payroll exists using Drizzle
    const existingPayrollRows = await db
      .select()
      .from(payrolls)
      .where(eq(payrolls.id, id))
      .limit(1);

    if (existingPayrollRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Payroll not found'
        },
        { status: 404 }
      );
    }

    const existingPayroll = existingPayrollRows[0];

    // Helper function to validate numeric values
    const isValidNumber = (value: any): boolean => {
      return value !== undefined && value !== null && !isNaN(Number(value));
    };

    // Calculate final amount
    const finalAmount = (isValidNumber(base_salary) ? base_salary : existingPayroll.baseSalary) + 
                       (isValidNumber(overtime_amount) ? overtime_amount : existingPayroll.overtimeAmount) + 
                       (isValidNumber(bonus_amount) ? bonus_amount : existingPayroll.bonusAmount) - 
                       (isValidNumber(deduction_amount) ? deduction_amount : existingPayroll.deductionAmount) - 
                       (isValidNumber(advance_deduction) ? advance_deduction : existingPayroll.advanceDeduction);

    // Update payroll using Drizzle
    const updatedPayrollRows = await db
      .update(payrolls)
      .set({
        baseSalary: isValidNumber(base_salary) ? base_salary.toString() : existingPayroll.baseSalary,
        overtimeAmount: isValidNumber(overtime_amount) ? overtime_amount.toString() : existingPayroll.overtimeAmount,
        bonusAmount: isValidNumber(bonus_amount) ? bonus_amount.toString() : existingPayroll.bonusAmount,
        deductionAmount: isValidNumber(deduction_amount) ? deduction_amount.toString() : existingPayroll.deductionAmount,
        advanceDeduction: isValidNumber(advance_deduction) ? advance_deduction.toString() : existingPayroll.advanceDeduction,
        finalAmount: finalAmount.toString(),
        notes: notes !== undefined ? notes : existingPayroll.notes,
        status: status !== undefined ? status : existingPayroll.status,
        updatedAt: new Date().toISOString()
      })
      .where(eq(payrolls.id, id))
      .returning();

    const updatedPayroll = updatedPayrollRows[0];

    // Get updated payroll items using Drizzle
    const updatedPayrollItemsRows = await db
      .select()
      .from(payrollItems)
      .where(eq(payrollItems.payrollId, id))
      .orderBy(payrollItems.order);

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
      employee,
      items: updatedPayrollItemsRows
    };

    return NextResponse.json({
      success: true,
      data: formattedUpdatedPayroll,
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
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

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

    // Delete payroll items first (cascade) using Drizzle
    await db
      .delete(payrollItems)
      .where(eq(payrollItems.payrollId, id));

    // Delete payroll using Drizzle
    await db
      .delete(payrolls)
      .where(eq(payrolls.id, id));

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
  }
}
