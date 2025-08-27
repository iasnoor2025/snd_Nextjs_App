import { db } from '@/lib/drizzle';
import { employees, salaryIncrements } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/salary-increments/[id]/apply - Apply salary increment
const applySalaryIncrementHandler = async (_request: NextRequest, ...args: unknown[]) => {
  try {
    const { params } = args[0] as { params: Promise<{ id: string }> };
    const { id } = await params;
    
    if (isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Check if salary increment exists and can be applied
    const existingIncrement = await db
      .select({
        id: salaryIncrements.id,
        status: salaryIncrements.status,
        employee_id: salaryIncrements.employeeId,
        effective_date: salaryIncrements.effectiveDate,
        new_base_salary: salaryIncrements.newBaseSalary,
        new_food_allowance: salaryIncrements.newFoodAllowance,
        new_housing_allowance: salaryIncrements.newHousingAllowance,
        new_transport_allowance: salaryIncrements.newTransportAllowance,
      })
      .from(salaryIncrements)
      .where(eq(salaryIncrements.id, parseInt(id)))
      .limit(1);

    if (existingIncrement.length === 0) {
      return NextResponse.json({ error: 'Salary increment not found' }, { status: 404 });
    }

    const increment = existingIncrement[0];

    // Only allow application if status is approved
    if (increment.status !== 'approved') {
      return NextResponse.json(
        { error: 'Salary increment must be approved before it can be applied' },
        { status: 400 }
      );
    }

    // Check if effective date has been reached
    const effectiveDate = new Date(increment.effective_date);
    const today = new Date();
    if (effectiveDate > today) {
      return NextResponse.json(
        { error: 'Cannot apply salary increment before its effective date' },
        { status: 400 }
      );
    }

    // Start a transaction to update both salary increment and employee
    const result = await db.transaction(async tx => {
      // Update the salary increment status to applied
      const [appliedIncrement] = await tx
        .update(salaryIncrements)
        .set({
          status: 'applied',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(salaryIncrements.id, parseInt(id)))
        .returning();

      // Update the employee's salary information
      const [updatedEmployee] = await tx
        .update(employees)
        .set({
          basicSalary: increment.new_base_salary,
          foodAllowance: increment.new_food_allowance,
          housingAllowance: increment.new_housing_allowance,
          transportAllowance: increment.new_transport_allowance,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(employees.id, increment.employee_id))
        .returning();

      return { appliedIncrement, updatedEmployee };
    });

    return NextResponse.json({
      success: true,
      data: {
        id: result.appliedIncrement.id,
        employee_id: result.appliedIncrement.employeeId,
        increment_type: result.appliedIncrement.incrementType,
        effective_date: result.appliedIncrement.effectiveDate,
        reason: result.appliedIncrement.reason,
        status: result.appliedIncrement.status,
        updated_at: result.appliedIncrement.updatedAt,
        employee: {
          id: result.updatedEmployee.id,
          basic_salary: result.updatedEmployee.basicSalary,
          food_allowance: result.updatedEmployee.foodAllowance,
          housing_allowance: result.updatedEmployee.housingAllowance,
          transport_allowance: result.updatedEmployee.transportAllowance,
        },
      },
      message: 'Salary increment applied successfully',
    });
  } catch (error) {
    console.error('Error applying salary increment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to apply salary increment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};

export const POST = withPermission(PermissionConfigs.salaryIncrement.apply)(applySalaryIncrementHandler);
