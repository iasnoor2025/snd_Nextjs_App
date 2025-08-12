import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { payrolls, employees, payrollItems, departments, designations } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payroll ID' },
        { status: 400 }
      );
    }

    const payrollData = await db
      .select({
        id: payrolls.id,
        employeeId: payrolls.employeeId,
        month: payrolls.month,
        year: payrolls.year,
        baseSalary: payrolls.baseSalary,
        overtimeAmount: payrolls.overtimeAmount,
        bonusAmount: payrolls.bonusAmount,
        deductionAmount: payrolls.deductionAmount,
        advanceDeduction: payrolls.advanceDeduction,
        finalAmount: payrolls.finalAmount,
        totalWorkedHours: payrolls.totalWorkedHours,
        overtimeHours: payrolls.overtimeHours,
        status: payrolls.status,
        notes: payrolls.notes,
        approvedBy: payrolls.approvedBy,
        approvedAt: payrolls.approvedAt,
        paidBy: payrolls.paidBy,
        paidAt: payrolls.paidAt,
        paymentMethod: payrolls.paymentMethod,
        paymentReference: payrolls.paymentReference,
        paymentStatus: payrolls.paymentStatus,
        currency: payrolls.currency,
        createdAt: payrolls.createdAt,
        updatedAt: payrolls.updatedAt,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
          email: employees.email,
          phone: employees.phone,
          basicSalary: employees.basicSalary,
          departmentId: employees.departmentId,
          designationId: employees.designationId,
        },
        department: {
          id: departments.id,
          name: departments.name,
        },
        designation: {
          id: designations.id,
          name: designations.name,
        }
      })
      .from(payrolls)
      .leftJoin(employees, eq(payrolls.employeeId, employees.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(designations, eq(employees.designationId, designations.id))
      .where(eq(payrolls.id, id))
      .limit(1);

    if (!payrollData || payrollData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Payroll not found' },
        { status: 404 }
      );
    }

    const payroll = payrollData[0];

    // Get payroll items
    const payrollItemsData = await db
      .select({
        id: payrollItems.id,
        payrollId: payrollItems.payrollId,
        type: payrollItems.type,
        description: payrollItems.description,
        amount: payrollItems.amount,
        isTaxable: payrollItems.isTaxable,
        taxRate: payrollItems.taxRate,
        order: payrollItems.order,
        createdAt: payrollItems.createdAt,
        updatedAt: payrollItems.updatedAt,
      })
      .from(payrollItems)
      .where(eq(payrollItems.payrollId, id))
      .orderBy(payrollItems.order);

    // Transform data to match frontend expectations (snake_case)
    const transformedPayroll = {
      id: payroll.id,
      employee_id: payroll.employeeId,
      month: payroll.month,
      year: payroll.year,
      base_salary: Number(payroll.baseSalary),
      overtime_amount: Number(payroll.overtimeAmount),
      bonus_amount: Number(payroll.bonusAmount),
      deduction_amount: Number(payroll.deductionAmount),
      advance_deduction: Number(payroll.advanceDeduction),
      final_amount: Number(payroll.finalAmount),
      total_worked_hours: Number(payroll.totalWorkedHours),
      overtime_hours: Number(payroll.overtimeHours),
      status: payroll.status,
      notes: payroll.notes,
      approved_by: payroll.approvedBy,
      approved_at: payroll.approvedAt,
      paid_by: payroll.paidBy,
      paid_at: payroll.paidAt,
      payment_method: payroll.paymentMethod,
      payment_reference: payroll.paymentReference,
      payment_status: payroll.paymentStatus,
      currency: payroll.currency,
      created_at: payroll.createdAt,
      updated_at: payroll.updatedAt,
      employee: {
        id: payroll.employee?.id || 0,
        first_name: payroll.employee?.firstName || '',
        last_name: payroll.employee?.lastName || '',
        full_name: payroll.employee ? `${payroll.employee.firstName} ${payroll.employee.lastName}` : '',
        file_number: payroll.employee?.fileNumber || '',
        basic_salary: Number(payroll.employee?.basicSalary || 0),
        department: payroll.department?.name || '',
        designation: payroll.designation?.name || '',
        status: 'active' // Default status
      },
      items: payrollItemsData.map(item => ({
        id: item.id,
        payroll_id: item.payrollId,
        type: item.type,
        description: item.description,
        amount: Number(item.amount),
        is_taxable: item.isTaxable,
        tax_rate: Number(item.taxRate),
        order: item.order,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      }))
    };

    return NextResponse.json({
      success: true,
      data: transformedPayroll
    });

  } catch (error) {
    console.error('Error fetching payroll:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
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
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid payroll ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Check if payroll exists
    const existingPayroll = await db
      .select({ id: payrolls.id })
      .from(payrolls)
      .where(eq(payrolls.id, id))
      .limit(1);

    if (existingPayroll.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Payroll not found' },
        { status: 404 }
      );
    }

    // Calculate final amount
    const baseSalary = Number(body.baseSalary) || 0;
    const overtimeAmount = Number(body.overtimeAmount) || 0;
    const bonusAmount = Number(body.bonusAmount) || 0;
    const deductionAmount = Number(body.deductionAmount) || 0;
    const advanceDeduction = Number(body.advanceDeduction) || 0;
    
    // If absent days are provided, calculate absent deduction
    let absentDeduction = 0;
    if (body.absentDays && body.month && body.year) {
      const daysInMonth = new Date(body.year, body.month, 0).getDate();
      
      // Use simple formula: (Basic Salary / Total Days in Month) * Absent Days
      absentDeduction = (baseSalary / daysInMonth) * Number(body.absentDays);
      console.log(`Absent calculation: (${baseSalary} / ${daysInMonth}) * ${body.absentDays} = ${absentDeduction}`);
    }
    
    const finalAmount = baseSalary + overtimeAmount + bonusAmount - deductionAmount - absentDeduction - advanceDeduction;

    // Update payroll
    const updatedPayrolls = await db
      .update(payrolls)
      .set({
        baseSalary: baseSalary.toString(),
        overtimeAmount: overtimeAmount.toString(),
        bonusAmount: bonusAmount.toString(),
        deductionAmount: deductionAmount.toString(),
        advanceDeduction: advanceDeduction.toString(),
        finalAmount: finalAmount.toString(),
        totalWorkedHours: (body.totalWorkedHours || 0).toString(),
        overtimeHours: (body.overtimeHours || 0).toString(),
        status: body.status || 'pending',
        notes: body.notes || '',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(payrolls.id, id))
      .returning();

    const updatedPayroll = updatedPayrolls[0];

    // Update payroll items if provided
    if (body.items && Array.isArray(body.items)) {
      // Delete existing items
      await db
        .delete(payrollItems)
        .where(eq(payrollItems.payrollId, id));

      // Create new items
      const payrollItemsData = body.items.map((item: any, index: number) => ({
        payrollId: id,
        type: item.type || 'earnings',
        description: item.description || '',
        amount: (item.amount || 0).toString(),
        isTaxable: item.isTaxable || false,
        taxRate: (item.taxRate || 0).toString(),
        order: index + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      await db
        .insert(payrollItems)
        .values(payrollItemsData);
    }

    return NextResponse.json({
      success: true,
      message: 'Payroll updated successfully',
      data: updatedPayroll
    });

  } catch (error) {
    console.error('Error updating payroll:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update payroll' },
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
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid payroll ID' },
        { status: 400 }
      );
    }

    // Check if payroll exists
    const existingPayroll = await db
      .select({ id: payrolls.id })
      .from(payrolls)
      .where(eq(payrolls.id, id))
      .limit(1);

    if (existingPayroll.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Payroll not found' },
        { status: 404 }
      );
    }

    // Delete payroll items first
    await db
      .delete(payrollItems)
      .where(eq(payrollItems.payrollId, id));

    // Delete payroll
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
      { success: false, message: 'Failed to delete payroll' },
      { status: 500 }
    );
  }
}
