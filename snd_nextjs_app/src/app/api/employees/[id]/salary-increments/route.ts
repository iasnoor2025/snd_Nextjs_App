import { db } from '@/lib/drizzle';
import { employees as employeesTable, salaryIncrements, users } from '@/lib/drizzle/schema';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET({ params }: { params: { id: string } }) {
  try {
    console.log('Starting GET /api/employees/[id]/salary-increments');

    const { id } = params;
    console.log('Employee ID from params:', id);

    const employeeId = parseInt(id);
    console.log('Parsed employee ID:', employeeId);

    if (isNaN(employeeId)) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    console.log('About to check if employee exists...');

    // Check if employee exists using Drizzle
    let employee;
    try {
      employee = await db
        .select({
          id: employeesTable.id,
          firstName: employeesTable.firstName,
          lastName: employeesTable.lastName,
          fileNumber: employeesTable.fileNumber,
        })
        .from(employeesTable)
        .where(eq(employeesTable.id, employeeId))
        .limit(1);

      console.log('Employee check result:', employee.length > 0 ? 'Found' : 'Not found');
    } catch (employeeError) {
      console.error('Error checking employee:', employeeError);
      throw employeeError;
    }

    if (employee.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    console.log('About to query salary increments with Drizzle...');

    // Query salary increments using Drizzle - full fields
    let salaryIncrementsData;
    try {
      salaryIncrementsData = await db
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

      console.log('Drizzle query successful, found:', salaryIncrementsData.length);
    } catch (queryError) {
      console.error('Error in salary increments query:', queryError);
      throw queryError;
    }

    // Fetch user names separately to avoid complex joins
    const userIds = salaryIncrementsData
      .map(inc => [inc.requestedBy, inc.approvedBy, inc.rejectedBy])
      .flat()
      .filter(id => id !== null && id !== undefined);

    const uniqueUserIds = [...new Set(userIds)];
    let usersData: { id: number; name: string }[] = [];

    try {
      if (uniqueUserIds.length > 0) {
        console.log('Fetching user data for IDs:', uniqueUserIds);
        // Use a simpler approach - query users one by one to avoid inArray issues
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
            console.error(`Error fetching user ${userId}:`, userError);
            // Continue with other users
          }
        }
        console.log('Found users:', usersData.length);
      }
    } catch (userError) {
      console.error('Error fetching user data:', userError);
      // Continue without user data if there's an error
      usersData = [];
    }

    // Create a map for quick user lookup
    const userMap = new Map(usersData.map(user => [user.id, user.name]));

    console.log('Transforming data...');

    // Transform the data to match the expected format - full version
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

    console.log('Transformation complete, returning data...');
    return NextResponse.json({ data: transformedIncrements });
  } catch (error) {
    console.error('Error in salary increments endpoint:', error);

    // Log more detailed error information
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
