import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/drizzle';
import { employees as employeesTable, salaryIncrements, users } from '@/lib/drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

async function getEmployeeSalaryIncrementsHandler(
  request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } },
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle params which might be a Promise or object
    let resolvedParams;
    if (params instanceof Promise) {
      try {
        resolvedParams = await params;
      } catch (error) {
        return NextResponse.json({ error: 'Failed to resolve route parameters' }, { status: 500 });
      }
    } else {
      resolvedParams = params;
    }

    if (!resolvedParams || !resolvedParams.id) {
      return NextResponse.json({ error: 'Invalid route parameters' }, { status: 400 });
    }
    
    const { id } = resolvedParams;
    const employeeId = parseInt(id);
    
    if (isNaN(employeeId)) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }
    
    // For employee users, ensure they can only access their own employee record
    if (request.employeeAccess?.ownEmployeeId) {
      if (employeeId !== request.employeeAccess.ownEmployeeId) {
        return NextResponse.json(
          { error: 'You can only access your own employee record' },
          { status: 403 }
        );
      }
    }
    
    // Check if employee exists
    const employee = await db
      .select({
        id: employeesTable.id,
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
        fileNumber: employeesTable.fileNumber,
      })
      .from(employeesTable)
      .where(eq(employeesTable.id, employeeId))
      .limit(1);
    
    if (employee.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }
    
    // Query salary increments
    const salaryIncrementsData = await db
      .select({
        id: salaryIncrements.id,
        employeeId: salaryIncrements.employeeId,
        currentBaseSalary: salaryIncrements.currentBaseSalary,
        currentFoodAllowance: salaryIncrements.currentFoodAllowance,
        currentHousingAllowance: salaryIncrements.currentHousingAllowance,
        currentTransportAllowance: salaryIncrements.currentTransportAllowance,
        newBaseSalary: salaryIncrements.newBaseSalary,
        newFoodAllowance: salaryIncrements.newFoodAllowance,
        newHousingAllowance: salaryIncrements.newHousingAllowance,
        newTransportAllowance: salaryIncrements.newTransportAllowance,
        incrementAmount: salaryIncrements.incrementAmount,
        incrementPercentage: salaryIncrements.incrementPercentage,
        incrementType: salaryIncrements.incrementType,
        effectiveDate: salaryIncrements.effectiveDate,
        reason: salaryIncrements.reason,
        status: salaryIncrements.status,
        requestedAt: salaryIncrements.requestedAt,
        approvedAt: salaryIncrements.approvedAt,
        rejectedAt: salaryIncrements.rejectedAt,
        requestedBy: salaryIncrements.requestedBy,
        approvedBy: salaryIncrements.approvedBy,
        rejectedBy: salaryIncrements.rejectedBy,
        notes: salaryIncrements.notes,
        createdAt: salaryIncrements.createdAt,
        updatedAt: salaryIncrements.updatedAt,
      })
      .from(salaryIncrements)
      .where(eq(salaryIncrements.employeeId, employeeId))
      .orderBy(desc(salaryIncrements.effectiveDate));
    
    // Fetch user names for the salary increments
    const userIds = salaryIncrementsData
      .map(inc => [inc.requestedBy, inc.approvedBy, inc.rejectedBy])
      .flat()
      .filter(id => id !== null && id !== undefined);
    const uniqueUserIds = [...new Set(userIds)];
    
    const usersData: { id: number; name: string }[] = [];
    if (uniqueUserIds.length > 0) {
      for (const userId of uniqueUserIds) {
        try {
          const userResult = await db
            .select({ id: users.id, name: users.name })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
          if (userResult.length > 0 && userResult[0]) {
            usersData.push(userResult[0]);
          }
        } catch (userError) {
          // Continue with other users if one fails
        }
      }
    }
    
    // Create a map for quick user lookup
    const userMap = new Map(usersData.map(user => [user.id, user.name]));
    
    // Transform the data to match the expected format
    const transformedIncrements = salaryIncrementsData.map(increment => ({
      id: increment.id,
      employee_id: increment.employeeId,
      current_base_salary: increment.currentBaseSalary,
      current_food_allowance: increment.currentFoodAllowance,
      current_housing_allowance: increment.currentHousingAllowance,
      current_transport_allowance: increment.currentTransportAllowance,
      new_base_salary: increment.newBaseSalary,
      new_food_allowance: increment.newFoodAllowance,
      new_housing_allowance: increment.newHousingAllowance,
      new_transport_allowance: increment.newTransportAllowance,
      increment_amount: increment.incrementAmount,
      increment_percentage: increment.incrementPercentage,
      increment_type: increment.incrementType,
      effective_date: increment.effectiveDate,
      reason: increment.reason,
      status: increment.status,
      requested_at: increment.requestedAt,
      approved_at: increment.approvedAt,
      rejected_at: increment.rejectedAt,
      requested_by_user: increment.requestedBy
        ? {
            id: increment.requestedBy,
            name: userMap.get(increment.requestedBy) || 'Unknown',
          }
        : null,
      approved_by_user: increment.approvedBy
        ? {
            id: increment.approvedBy,
            name: userMap.get(increment.approvedBy) || 'Unknown',
          }
        : null,
      rejected_by_user: increment.rejectedBy
        ? {
            id: increment.rejectedBy,
            name: userMap.get(increment.rejectedBy) || 'Unknown',
          }
        : null,
      notes: increment.notes,
      created_at: increment.createdAt,
      updated_at: increment.updatedAt,
    }));
    
    return NextResponse.json({ data: transformedIncrements });
    
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const GET = withPermission(PermissionConfigs.salaryIncrement.read)(getEmployeeSalaryIncrementsHandler);
