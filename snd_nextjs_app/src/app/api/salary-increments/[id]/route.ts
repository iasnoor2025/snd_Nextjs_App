import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { salaryIncrements, employees, users } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { checkPermission } from '@/lib/rbac/enhanced-permission-service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission to view salary increments
    const canView = await checkPermission(session.user.id, 'SalaryIncrement', 'read');
    if (!canView) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id } = await params;
    if (isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const salaryIncrementData = await db
      .select({
        id: salaryIncrements.id,
        employee_id: salaryIncrements.employeeId,
        increment_type: salaryIncrements.incrementType,
        effective_date: salaryIncrements.effectiveDate,
        reason: salaryIncrements.reason,
        approved_by: salaryIncrements.approvedBy,
        approved_at: salaryIncrements.approvedAt,
        status: salaryIncrements.status,
        created_at: salaryIncrements.createdAt,
        updated_at: salaryIncrements.updatedAt,
        current_base_salary: salaryIncrements.currentBaseSalary,
        current_food_allowance: salaryIncrements.currentFoodAllowance,
        current_housing_allowance: salaryIncrements.currentHousingAllowance,
        current_transport_allowance: salaryIncrements.currentTransportAllowance,
        deleted_at: salaryIncrements.deletedAt,
        increment_amount: salaryIncrements.incrementAmount,
        increment_percentage: salaryIncrements.incrementPercentage,
        new_base_salary: salaryIncrements.newBaseSalary,
        new_food_allowance: salaryIncrements.newFoodAllowance,
        new_housing_allowance: salaryIncrements.newHousingAllowance,
        new_transport_allowance: salaryIncrements.newTransportAllowance,
        notes: salaryIncrements.notes,
        rejected_at: salaryIncrements.rejectedAt,
        rejected_by: salaryIncrements.rejectedBy,
        rejection_reason: salaryIncrements.rejectionReason,
        requested_at: salaryIncrements.requestedAt,
        requested_by: salaryIncrements.requestedBy,
        employee: {
          id: employees.id,
          first_name: employees.firstName,
          last_name: employees.lastName,
          employee_id: employees.fileNumber,
        },
        requested_by_user: {
          id: users.id,
          name: users.name,
        },
        approved_by_user: {
          id: users.id,
          name: users.name,
        },
        rejected_by_user: {
          id: users.id,
          name: users.name,
        },
      })
      .from(salaryIncrements)
      .leftJoin(employees, eq(salaryIncrements.employeeId, employees.id))
      .leftJoin(users, eq(salaryIncrements.requestedBy, users.id))
      .where(eq(salaryIncrements.id, parseInt(id)))
      .limit(1);

    if (salaryIncrementData.length === 0) {
      return NextResponse.json({ error: 'Salary increment not found' }, { status: 404 });
    }

    const item = salaryIncrementData[0];

    // Transform the data to match the expected interface
    const transformedData = {
      ...item!,
      employee: item!.employee ? {
        id: item!.employee.id,
        first_name: item!.employee.first_name,
        last_name: item!.employee.last_name,
        employee_id: item!.employee.employee_id,
      } : undefined,
      requested_by_user: item!.requested_by_user ? {
        id: item!.requested_by_user.id,
        name: item!.requested_by_user.name,
      } : undefined,
      approved_by_user: item!.approved_by_user ? {
        id: item!.approved_by_user.id,
        name: item!.approved_by_user.name,
      } : undefined,
      rejected_by_user: item!.rejected_by_user ? {
        id: item!.rejected_by_user.id,
        name: item!.rejected_by_user.name,
      } : undefined,
    };

    return NextResponse.json({
      success: true,
      data: transformedData,
    });
  } catch (error) {
    console.error('Error fetching salary increment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission to update salary increments
    const canUpdate = await checkPermission(session.user.id, 'SalaryIncrement', 'update');
    if (!canUpdate) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id } = await params;
    if (isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      increment_type,
      increment_percentage,
      increment_amount,
      reason,
      effective_date,
      notes,
      new_base_salary,
      new_food_allowance,
      new_housing_allowance,
      new_transport_allowance,
    } = body;

    // Check if salary increment exists
    const existingIncrement = await db
      .select({ id: salaryIncrements.id, status: salaryIncrements.status })
      .from(salaryIncrements)
      .where(eq(salaryIncrements.id, parseInt(id)))
      .limit(1);

    if (existingIncrement.length === 0) {
      return NextResponse.json({ error: 'Salary increment not found' }, { status: 404 });
    }

    // Only allow updates if status is pending
    if (existingIncrement[0]!.status !== 'pending') {
      return NextResponse.json(
        { error: 'Cannot update approved, rejected, or applied salary increments' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (increment_type !== undefined) updateData.incrementType = increment_type;
    if (increment_percentage !== undefined) updateData.incrementPercentage = increment_percentage;
    if (increment_amount !== undefined) updateData.incrementAmount = increment_amount;
    if (reason !== undefined) updateData.reason = reason;
    if (effective_date !== undefined) updateData.effectiveDate = new Date(effective_date);
    if (notes !== undefined) updateData.notes = notes;
    if (new_base_salary !== undefined) updateData.newBaseSalary = new_base_salary;
    if (new_food_allowance !== undefined) updateData.newFoodAllowance = new_food_allowance;
    if (new_housing_allowance !== undefined) updateData.newHousingAllowance = new_housing_allowance;
    if (new_transport_allowance !== undefined) updateData.newTransportAllowance = new_transport_allowance;

    // Update the salary increment
    const [updatedIncrement] = await db
      .update(salaryIncrements)
      .set(updateData)
      .where(eq(salaryIncrements.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        id: updatedIncrement!.id,
        employee_id: updatedIncrement!.employeeId,
        increment_type: updatedIncrement!.incrementType,
        effective_date: updatedIncrement!.effectiveDate,
        reason: updatedIncrement!.reason,
        status: updatedIncrement!.status,
        current_base_salary: updatedIncrement!.currentBaseSalary,
        new_base_salary: updatedIncrement!.newBaseSalary,
        increment_amount: updatedIncrement!.incrementAmount,
        increment_percentage: updatedIncrement!.incrementPercentage,
        notes: updatedIncrement!.notes,
        updated_at: updatedIncrement!.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating salary increment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission to delete salary increments
    const canDelete = await checkPermission(session.user.id, 'SalaryIncrement', 'delete');
    if (!canDelete) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id } = await params;
    if (isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Check if salary increment exists and can be deleted
    const existingIncrement = await db
      .select({ id: salaryIncrements.id, status: salaryIncrements.status })
      .from(salaryIncrements)
      .where(eq(salaryIncrements.id, parseInt(id)))
      .limit(1);

    if (existingIncrement.length === 0) {
      return NextResponse.json({ error: 'Salary increment not found' }, { status: 404 });
    }

    // Only allow deletion if status is pending
    if (existingIncrement[0]!.status !== 'pending') {
      return NextResponse.json(
        { error: 'Cannot delete approved, rejected, or applied salary increments' },
        { status: 400 }
      );
    }

    // Soft delete by setting deleted_at
    await db
      .update(salaryIncrements)
      .set({ deletedAt: new Date().toISOString().split('T')[0] })
      .where(eq(salaryIncrements.id, parseInt(id)));

    return NextResponse.json({
      success: true,
      message: 'Salary increment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting salary increment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
