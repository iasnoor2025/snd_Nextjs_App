import { db } from '@/lib/drizzle';
import { departments, designations, employees, payrollItems, payrolls } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid payroll ID' }, { status: 400 });
    }

    // Get payroll data
    const payrollResult = await db
      .select()
      .from(payrolls)
      .where(eq(payrolls.id, id))
      .limit(1);

    if (payrollResult.length === 0) {
      return NextResponse.json({ success: false, error: 'Payroll not found' }, { status: 404 });
    }

    const payroll = payrollResult[0]!; // Safe because we checked length above

    // Get employee data
    let employee = null;
    if (payroll.employeeId) {
      const employeeResult = await db
        .select()
        .from(employees)
        .where(eq(employees.id, payroll.employeeId))
        .limit(1);
      
      employee = employeeResult[0] || null;
    }

    // Get department data
    let department = null;
    if (employee?.departmentId) {
      const deptResult = await db
        .select()
        .from(departments)
        .where(eq(departments.id, employee.departmentId))
        .limit(1);
      
      department = deptResult[0] || null;
    }

    // Get designation data
    let designation = null;
    if (employee?.designationId) {
      const desigResult = await db
        .select()
        .from(designations)
        .where(eq(designations.id, employee.designationId))
        .limit(1);
      
      designation = desigResult[0] || null;
    }

    // Get payroll items
    const payrollItemsResult = await db
      .select()
      .from(payrollItems)
      .where(eq(payrollItems.payrollId, id));

    // Transform data to snake_case for frontend
    const responseData = {
      id: payroll.id,
      employee_id: payroll.employeeId,
      month: payroll.month,
      year: payroll.year,
      base_salary: payroll.baseSalary ? Number(payroll.baseSalary) : 0,
      overtime_amount: payroll.overtimeAmount ? Number(payroll.overtimeAmount) : 0,
      bonus_amount: payroll.bonusAmount ? Number(payroll.bonusAmount) : 0,
      deduction_amount: 0, // Removed all deductions except advance
      advance_deduction: payroll.advanceDeduction ? Number(payroll.advanceDeduction) : 0,
      final_amount: (payroll.baseSalary ? Number(payroll.baseSalary) : 0) + 
                   (payroll.overtimeAmount ? Number(payroll.overtimeAmount) : 0) + 
                   (payroll.bonusAmount ? Number(payroll.bonusAmount) : 0) - 
                   (payroll.advanceDeduction ? Number(payroll.advanceDeduction) : 0),
      total_worked_hours: payroll.totalWorkedHours ? Number(payroll.totalWorkedHours) : 0,
      overtime_hours: payroll.overtimeHours ? Number(payroll.overtimeHours) : 0,
      status: payroll.status || 'pending',
      notes: payroll.notes || '',
      approved_by: payroll.approvedBy,
      approved_at: payroll.approvedAt,
      paid_by: payroll.paidBy,
      paid_at: payroll.paidAt,
      payment_method: payroll.paymentMethod,
      payment_reference: payroll.paymentReference,
      payment_status: payroll.paymentStatus,
      currency: payroll.currency || 'SAR',
      created_at: payroll.createdAt,
      updated_at: payroll.updatedAt,
      employee: employee ? {
        id: employee.id,
        first_name: employee.firstName || '',
        last_name: employee.lastName || '',
        full_name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
        file_number: employee.fileNumber || '',
        basic_salary: employee.basicSalary ? Number(employee.basicSalary) : 0,
        department: department?.name || '',
        designation: designation?.name || '',
        status: 'active'
      } : null,
      items: payrollItemsResult.map(item => ({
        id: item.id,
        payroll_id: item.payrollId,
        type: item.type || 'earnings',
        description: item.description || '',
        amount: item.amount ? Number(item.amount) : 0,
        is_taxable: item.isTaxable || false,
        tax_rate: item.taxRate ? Number(item.taxRate) : 0,
        order: item.order || 1,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      }))
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });

  } catch (error) {
    console.error('Payroll GET error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: 'Invalid payroll ID' }, { status: 400 });
    }

    const body = await request.json();

    // Check if payroll exists
    const existingPayroll = await db
      .select({ id: payrolls.id })
      .from(payrolls)
      .where(eq(payrolls.id, id))
      .limit(1);

    if (existingPayroll.length === 0) {
      return NextResponse.json({ success: false, message: 'Payroll not found' }, { status: 404 });
    }

    // Calculate amounts
    const baseSalary = Number(body.baseSalary) || 0;
    const overtimeAmount = Number(body.overtimeAmount) || 0;
    const bonusAmount = Number(body.bonusAmount) || 0;
    const deductionAmount = 0; // Removed all deductions except advance
    const advanceDeduction = Number(body.advanceDeduction) || 0;

    const finalAmount = baseSalary + overtimeAmount + bonusAmount - advanceDeduction;

    // Update payroll
    const updatedPayroll = await db
      .update(payrolls)
      .set({
        baseSalary: baseSalary.toString(),
        overtimeAmount: overtimeAmount.toString(),
        bonusAmount: bonusAmount.toString(),
        deductionAmount: deductionAmount.toString(),
        advanceDeduction: advanceDeduction.toString(),
        finalAmount: finalAmount.toString(),
        totalWorkedHours: (Number(body.totalWorkedHours) || 0).toString(),
        overtimeHours: (Number(body.overtimeHours) || 0).toString(),
        status: body.status || 'pending',
        notes: body.notes || '',
        updatedAt: new Date().toISOString().split('T')[0], // Date only
      })
      .where(eq(payrolls.id, id))
      .returning();

    // Update payroll items if provided
    if (body.items && Array.isArray(body.items)) {
      // Delete existing items
      await db.delete(payrollItems).where(eq(payrollItems.payrollId, id));

      // Insert new items
      if (body.items.length > 0) {
        const itemsToInsert = body.items.map((item: Record<string, unknown>, index: number) => ({
          payrollId: id,
          type: item.type || 'earnings',
          description: item.description || '',
          amount: (Number(item.amount) || 0).toString(),
          isTaxable: Boolean(item.isTaxable),
          taxRate: (Number(item.taxRate) || 0).toString(),
          order: index + 1,
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
        }));

        await db.insert(payrollItems).values(itemsToInsert);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payroll updated successfully',
      data: updatedPayroll[0],
    });

  } catch (error) {
    console.error('Payroll PUT error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update payroll',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: 'Invalid payroll ID' }, { status: 400 });
    }

    // Check if payroll exists
    const existingPayroll = await db
      .select({ id: payrolls.id })
      .from(payrolls)
      .where(eq(payrolls.id, id))
      .limit(1);

    if (existingPayroll.length === 0) {
      return NextResponse.json({ success: false, message: 'Payroll not found' }, { status: 404 });
    }

    // Delete payroll items first
    await db.delete(payrollItems).where(eq(payrollItems.payrollId, id));

    // Delete payroll
    await db.delete(payrolls).where(eq(payrolls.id, id));

    return NextResponse.json({
      success: true,
      message: 'Payroll deleted successfully',
    });

  } catch (error) {
    console.error('Payroll DELETE error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete payroll',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}