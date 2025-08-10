import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { employees as employeesTable, salaryIncrements, users } from '@/lib/drizzle/schema';
import { eq, desc, inArray } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const employeeId = parseInt(id);
    if (isNaN(employeeId)) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    // Check if employee exists
    const employee = await db
      .select({ 
        id: employeesTable.id, 
        firstName: employeesTable.firstName, 
        lastName: employeesTable.lastName, 
        fileNumber: employeesTable.fileNumber 
      })
      .from(employeesTable)
      .where(eq(employeesTable.id, employeeId))
      .limit(1);

    if (employee.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const salaryIncrementsData = await db
      .select({
        id: salaryIncrements.id,
        employeeId: salaryIncrements.employeeId,
        currentBaseSalary: salaryIncrements.currentBaseSalary,
        newBaseSalary: salaryIncrements.newBaseSalary,
        incrementAmount: salaryIncrements.incrementAmount,
        incrementPercentage: salaryIncrements.incrementPercentage,
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

    // Fetch user names separately to avoid complex joins
    const userIds = salaryIncrementsData
      .map(inc => [inc.requestedBy, inc.approvedBy, inc.rejectedBy])
      .flat()
      .filter(id => id !== null && id !== undefined);

    const uniqueUserIds = [...new Set(userIds)];
    let usersData: { id: number; name: string }[] = [];
    
    if (uniqueUserIds.length > 0) {
      usersData = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(inArray(users.id, uniqueUserIds));
    }

    // Create a map for quick user lookup
    const userMap = new Map(usersData.map(user => [user.id, user.name]));

    // Transform the data to match the expected format
    const transformedIncrements = salaryIncrementsData.map(increment => ({
      id: increment.id,
      employee_id: increment.employeeId,
      current_salary: increment.currentBaseSalary,
      new_salary: increment.newBaseSalary,
      increment_amount: increment.incrementAmount,
      increment_percentage: increment.incrementPercentage,
      effective_date: increment.effectiveDate,
      reason: increment.reason,
      status: increment.status,
      requested_at: increment.requestedAt,
      approved_at: increment.approvedAt,
      rejected_at: increment.rejectedAt,
      requested_by_user: increment.requestedBy ? {
        id: increment.requestedBy,
        name: userMap.get(increment.requestedBy) || 'Unknown',
      } : null,
      approved_by_user: increment.approvedBy ? {
        id: increment.approvedBy,
        name: userMap.get(increment.approvedBy) || 'Unknown',
      } : null,
      rejected_by_user: increment.rejectedBy ? {
        id: increment.rejectedBy,
        name: userMap.get(increment.rejectedBy) || 'Unknown',
      } : null,
      notes: increment.notes,
      created_at: increment.createdAt,
      updated_at: increment.updatedAt,
    }));

    return NextResponse.json({ data: transformedIncrements });
  } catch (error) {
    console.error('Error fetching employee salary history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
