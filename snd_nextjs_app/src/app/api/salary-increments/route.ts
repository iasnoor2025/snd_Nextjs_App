import { db } from '@/lib/drizzle';
import { employees, salaryIncrements, users } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { and, desc, eq, gte, isNull, lte, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

// GET /api/salary-increments - List salary increments
const getSalaryIncrementsHandler = async (_request: NextRequest) => {
  try {
    const { searchParams } = new URL(_request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const employeeId = searchParams.get('employee_id');
    const status = searchParams.get('status');
    const incrementType = searchParams.get('increment_type');
    const effectiveDateFrom = searchParams.get('effective_date_from');
    const effectiveDateTo = searchParams.get('effective_date_to');

    const offset = (page - 1) * limit;

    // Build where conditions array
    const whereConditions: (typeof eq | typeof gte | typeof lte | typeof isNull)[] = [];

    if (employeeId) {
      whereConditions.push(eq(salaryIncrements.employeeId, parseInt(employeeId)));
    }

    if (status) {
      whereConditions.push(eq(salaryIncrements.status, status));
    }

    if (incrementType) {
      whereConditions.push(eq(salaryIncrements.incrementType, incrementType));
    }

    if (effectiveDateFrom) {
      whereConditions.push(gte(salaryIncrements.effectiveDate, effectiveDateFrom));
    }

    if (effectiveDateTo) {
      whereConditions.push(lte(salaryIncrements.effectiveDate, effectiveDateTo));
    }

    // Add condition to exclude deleted records
    whereConditions.push(isNull(salaryIncrements.deletedAt));

    // Get total count with filters
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(salaryIncrements)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const total = totalCountResult[0]?.count || 0;
    const pages = Math.ceil(total / limit);

    // Get salary increments with employee and user details using proper Drizzle joins
    const salaryIncrementsData = await db
      .select({
        // Salary increment fields
        id: salaryIncrements.id,
        employeeId: salaryIncrements.employeeId,
        incrementType: salaryIncrements.incrementType,
        effectiveDate: salaryIncrements.effectiveDate,
        reason: salaryIncrements.reason,
        approvedBy: salaryIncrements.approvedBy,
        approvedAt: salaryIncrements.approvedAt,
        status: salaryIncrements.status,
        createdAt: salaryIncrements.createdAt,
        updatedAt: salaryIncrements.updatedAt,
        currentBaseSalary: salaryIncrements.currentBaseSalary,
        currentFoodAllowance: salaryIncrements.currentFoodAllowance,
        currentHousingAllowance: salaryIncrements.currentHousingAllowance,
        currentTransportAllowance: salaryIncrements.currentTransportAllowance,
        deletedAt: salaryIncrements.deletedAt,
        incrementAmount: salaryIncrements.incrementAmount,
        incrementPercentage: salaryIncrements.incrementPercentage,
        newBaseSalary: salaryIncrements.newBaseSalary,
        newFoodAllowance: salaryIncrements.newFoodAllowance,
        newHousingAllowance: salaryIncrements.newHousingAllowance,
        newTransportAllowance: salaryIncrements.newTransportAllowance,
        notes: salaryIncrements.notes,
        rejectedAt: salaryIncrements.rejectedAt,
        rejectedBy: salaryIncrements.rejectedBy,
        rejectionReason: salaryIncrements.rejectionReason,
        requestedAt: salaryIncrements.requestedAt,
        requestedBy: salaryIncrements.requestedBy,
        // Employee fields
        employeeFirstName: employees.firstName,
        employeeLastName: employees.lastName,
        employeeEmail: employees.email,
        employeePhone: employees.phone,
        employeeBasicSalary: employees.basicSalary,
        employeeFoodAllowance: employees.foodAllowance,
        employeeHousingAllowance: employees.housingAllowance,
        employeeTransportAllowance: employees.transportAllowance,
        // User fields for requested by
        requesterName: users.name,
        requesterEmail: users.email,
      })
      .from(salaryIncrements)
      .leftJoin(employees, eq(salaryIncrements.employeeId, employees.id))
      .leftJoin(users, eq(salaryIncrements.requestedBy, users.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(salaryIncrements.createdAt))
      .offset(offset)
      .limit(limit);

    // Transform the data to match frontend expectations
    const transformedData = salaryIncrementsData.map(item => ({
      id: item.id,
      employee_id: item.employeeId,
      employee: {
        id: item.employeeId,
        first_name: item.employeeFirstName || '',
        last_name: item.employeeLastName || '',
        employee_id: item.employeeId.toString(),
      },
      increment_type: item.incrementType,
      effective_date: item.effectiveDate,
      reason: item.reason || '',
      current_base_salary: item.currentBaseSalary ? parseFloat(item.currentBaseSalary) : 0,
      current_food_allowance: item.currentFoodAllowance ? parseFloat(item.currentFoodAllowance) : 0,
      current_housing_allowance: item.currentHousingAllowance ? parseFloat(item.currentHousingAllowance) : 0,
      current_transport_allowance: item.currentTransportAllowance ? parseFloat(item.currentTransportAllowance) : 0,
      increment_amount: item.incrementAmount ? parseFloat(item.incrementAmount) : 0,
      increment_percentage: item.incrementPercentage ? parseFloat(item.incrementPercentage) : 0,
      new_base_salary: item.newBaseSalary ? parseFloat(item.newBaseSalary) : 0,
      new_food_allowance: item.newFoodAllowance ? parseFloat(item.newFoodAllowance) : 0,
      new_housing_allowance: item.newHousingAllowance ? parseFloat(item.newHousingAllowance) : 0,
      new_transport_allowance: item.newTransportAllowance ? parseFloat(item.newTransportAllowance) : 0,
      status: item.status,
      notes: item.notes || '',
      requested_at: item.requestedAt,
      requested_by: item.requestedBy,
      requested_by_user: {
        id: item.requestedBy || 0,
        name: item.requesterName || '',
      },
      approved_at: item.approvedAt,
      approved_by: item.approvedBy,
      rejected_at: item.rejectedAt,
      rejected_by: item.rejectedBy,
      rejection_reason: item.rejectionReason || '',
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: transformedData,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNextPage: page < pages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching salary increments:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch salary increments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};

// POST /api/salary-increments - Create new salary increment
const createSalaryIncrementHandler = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const {
      employee_id,
      increment_type,
      effective_date,
      reason,
      current_base_salary,
      current_food_allowance,
      current_housing_allowance,
      current_transport_allowance,
      increment_amount,
      increment_percentage,
      new_base_salary,
      new_food_allowance,
      new_housing_allowance,
      new_transport_allowance,
      notes,
    } = body;

    // Validate required fields
    if (!employee_id) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    if (!increment_type) {
      return NextResponse.json({ error: 'Increment type is required' }, { status: 400 });
    }

    if (!effective_date) {
      return NextResponse.json({ error: 'Effective date is required' }, { status: 400 });
    }

    // Get current user ID from session (this will be handled by the permission middleware)
    const session = await getServerSession();
    const requestedBy = session?.user?.id;

    if (!requestedBy) {
      return NextResponse.json({ error: 'User session not found' }, { status: 401 });
    }

    // Get current employee salary information if not provided
    let currentBaseSalary = current_base_salary;
    let currentFoodAllowance = current_food_allowance;
    let currentHousingAllowance = current_housing_allowance;
    let currentTransportAllowance = current_transport_allowance;

    if (!currentBaseSalary || !currentFoodAllowance || !currentHousingAllowance || !currentTransportAllowance) {
      const employee = await db
        .select({
          basicSalary: employees.basicSalary,
          foodAllowance: employees.foodAllowance,
          housingAllowance: employees.housingAllowance,
          transportAllowance: employees.transportAllowance,
        })
        .from(employees)
        .where(eq(employees.id, parseInt(employee_id)))
        .limit(1);

      if (employee.length === 0) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }

      const emp = employee[0];
      currentBaseSalary = currentBaseSalary || emp.basicSalary;
      currentFoodAllowance = currentFoodAllowance || emp.foodAllowance;
      currentHousingAllowance = currentHousingAllowance || emp.housingAllowance;
      currentTransportAllowance = currentTransportAllowance || emp.transportAllowance;
    }

    // Calculate new values if not provided
    let newBaseSalary = new_base_salary;
    let newFoodAllowance = new_food_allowance;
    let newHousingAllowance = new_housing_allowance;
    let newTransportAllowance = new_transport_allowance;

    if (increment_type === 'percentage' && increment_percentage) {
      const percentage = increment_percentage / 100;
      newBaseSalary = newBaseSalary || (parseFloat(currentBaseSalary) * (1 + percentage));
      newFoodAllowance = newFoodAllowance || (parseFloat(currentFoodAllowance) * (1 + percentage));
      newHousingAllowance = newHousingAllowance || (parseFloat(currentHousingAllowance) * (1 + percentage));
      newTransportAllowance = newTransportAllowance || (parseFloat(currentTransportAllowance) * (1 + percentage));
    } else if (increment_type === 'amount' && increment_amount) {
      newBaseSalary = newBaseSalary || (parseFloat(currentBaseSalary) + increment_amount);
    }

    // Ensure we have new values
    if (!newBaseSalary) newBaseSalary = currentBaseSalary;
    if (!newFoodAllowance) newFoodAllowance = currentFoodAllowance;
    if (!newHousingAllowance) newHousingAllowance = currentHousingAllowance;
    if (!newTransportAllowance) newTransportAllowance = currentTransportAllowance;

    // Format dates to YYYY-MM-DD format for date type fields
    const effectiveDateFormatted = new Date(effective_date).toISOString().split('T')[0];
    const requestedAtFormatted = new Date().toISOString().split('T')[0];
    const createdAtFormatted = new Date().toISOString().split('T')[0];
    const updatedAtFormatted = new Date().toISOString().split('T')[0];

    const [inserted] = await db
      .insert(salaryIncrements)
      .values({
        employeeId: parseInt(employee_id),
        incrementType: increment_type,
        effectiveDate: effectiveDateFormatted,
        reason: reason || 'Salary increment request',
        currentBaseSalary: String(currentBaseSalary),
        currentFoodAllowance: String(currentFoodAllowance),
        currentHousingAllowance: String(currentHousingAllowance),
        currentTransportAllowance: String(currentTransportAllowance),
        incrementAmount: increment_amount ? String(increment_amount) : null,
        incrementPercentage: increment_percentage ? String(increment_percentage) : null,
        newBaseSalary: String(newBaseSalary),
        newFoodAllowance: String(newFoodAllowance),
        newHousingAllowance: String(newHousingAllowance),
        newTransportAllowance: String(newTransportAllowance),
        status: 'pending',
        notes: notes || null,
        requestedAt: requestedAtFormatted,
        requestedBy: requestedBy,
        createdAt: createdAtFormatted,
        updatedAt: updatedAtFormatted,
      })
      .returning();

    const salaryIncrement = inserted;

    return NextResponse.json(
      {
        success: true,
        data: salaryIncrement,
        message: 'Salary increment request created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating salary increment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create salary increment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};

export const GET = withPermission(PermissionConfigs.salaryIncrement.read)(getSalaryIncrementsHandler);
export const POST = withPermission(PermissionConfigs.salaryIncrement.create)(createSalaryIncrementHandler);
