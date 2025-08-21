import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { employees, salaryIncrements, users } from '@/lib/drizzle/schema';
import { checkPermission } from '@/lib/rbac/enhanced-permission-service';
import { and, desc, eq, gte, isNull, lte, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission to view salary increments
    const canView = await checkPermission(session.user.id, 'SalaryIncrement', 'read');
    if (!canView) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

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
    const whereConditions: any[] = [];

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
        employeeId_inner: employees.id,
        employeeFirstName: employees.firstName,
        employeeLastName: employees.lastName,
        employeeFileNumber: employees.fileNumber,
        // User fields for requested by
        requestedByUserName: users.name,
        requestedByUserEmail: users.email,
      })
      .from(salaryIncrements)
      .leftJoin(employees, eq(salaryIncrements.employeeId, employees.id))
      .leftJoin(users, eq(salaryIncrements.requestedBy, users.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(salaryIncrements.createdAt))
      .limit(limit)
      .offset(offset);

    // Transform the data to match the expected interface
    const transformedData = salaryIncrementsData.map(item => ({
      id: item.id,
      employee_id: item.employeeId,
      increment_type: item.incrementType,
      effective_date: item.effectiveDate,
      reason: item.reason,
      approved_by: item.approvedBy,
      approved_at: item.approvedAt,
      status: item.status,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
      current_base_salary: item.currentBaseSalary,
      current_food_allowance: item.currentFoodAllowance,
      current_housing_allowance: item.currentHousingAllowance,
      current_transport_allowance: item.currentTransportAllowance,
      deleted_at: item.deletedAt,
      increment_amount: item.incrementAmount,
      increment_percentage: item.incrementPercentage,
      new_base_salary: item.newBaseSalary,
      new_food_allowance: item.newFoodAllowance,
      new_housing_allowance: item.newHousingAllowance,
      new_transport_allowance: item.newTransportAllowance,
      notes: item.notes,
      rejected_at: item.rejectedAt,
      rejected_by: item.rejectedBy,
      rejection_reason: item.rejectionReason,
      requested_at: item.requestedAt,
      requested_by: item.requestedBy,
      employee: item.employeeId_inner
        ? {
            id: item.employeeId_inner,
            first_name: item.employeeFirstName,
            last_name: item.employeeLastName,
            employee_id: item.employeeFileNumber,
          }
        : undefined,
      requested_by_user: item.requestedByUserName
        ? {
            id: item.requestedBy,
            name: item.requestedByUserName,
            email: item.requestedByUserEmail,
          }
        : undefined,
      approved_by_user: undefined, // Will be populated in a separate query if needed
      rejected_by_user: undefined, // Will be populated in a separate query if needed
    }));

    return NextResponse.json({
      data: transformedData,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });
  } catch (error) {

    // If table doesn't exist yet, return empty result
    if (
      error instanceof Error &&
      error.message.includes('relation') &&
      error.message.includes('does not exist')
    ) {
      return NextResponse.json({
        data: [],
        pagination: {
          page: 1,
          limit: 15,
          total: 0,
          pages: 1,
        },
      });
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

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission to create salary increments
    const canCreate = await checkPermission(session.user.id, 'SalaryIncrement', 'create');
    if (!canCreate) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await _request.json();
    const {
      employee_id,
      increment_type,
      increment_percentage,
      increment_amount,
      reason,
      effective_date,
      // notes, // Not used
      new_base_salary,
      // new_food_allowance, // Not used
      // new_housing_allowance, // Not used
      // new_transport_allowances, // Not used
      // apply_to_allowances, // Not used
    } = body;

    // Validate required fields
    if (!employee_id || !increment_type || !reason || !effective_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get current employee salary information
    const employee = await db
      .select({
        currentBaseSalary: employees.basicSalary,
        currentFoodAllowance: employees.foodAllowance,
        currentHousingAllowance: employees.housingAllowance,
        currentTransportAllowance: employees.transportAllowance,
      })
      .from(employees)
      .where(eq(employees.id, employee_id))
      .limit(1);

    if (employee.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const currentSalary = employee[0];
    if (!currentSalary) {
      return NextResponse.json({ error: 'Employee salary information not found' }, { status: 404 });
    }

    // Calculate new salary if not provided
    let calculatedNewBaseSalary = new_base_salary;
    // let calculatedNewFoodAllowance: number | undefined;
    // let calculatedNewHousingAllowance: number | undefined;
    // let calculatedNewTransportAllowance: number | undefined;

    if (increment_type === 'percentage' && increment_percentage) {
      const percentage = increment_percentage / 100;
      calculatedNewBaseSalary = Number(currentSalary.currentBaseSalary) * (1 + percentage);

      // if (apply_to_allowances) {
      //   calculatedNewFoodAllowance = Number(currentSalary.currentFoodAllowance) * (1 + percentage);
      //   calculatedNewHousingAllowance = Number(currentSalary.currentHousingAllowance) * (1 + percentage);
      //   calculatedNewTransportAllowance = Number(currentSalary.currentTransportAllowance) * (1 + percentage);
      // }
    } else if (increment_type === 'amount' && increment_amount) {
      calculatedNewBaseSalary = Number(currentSalary.currentBaseSalary) + increment_amount;
    }

    // Create the salary increment record
    const insertData = {
      employeeId: employee_id,
      incrementType: increment_type,
      effectiveDate: new Date(effective_date).toISOString().split('T')[0] || null,
      reason,
      notes: body.notes || '',
      status: 'pending',
      currentBaseSalary: currentSalary.currentBaseSalary,
      currentFoodAllowance: currentSalary.currentFoodAllowance,
      currentHousingAllowance: currentSalary.currentHousingAllowance,
      currentTransportAllowance: currentSalary.currentTransportAllowance,
      newBaseSalary: calculatedNewBaseSalary || currentSalary.currentBaseSalary,
      newFoodAllowance: body.new_food_allowance || currentSalary.currentFoodAllowance,
      newHousingAllowance: body.new_housing_allowance || currentSalary.currentHousingAllowance,
      newTransportAllowance: body.new_transport_allowance || currentSalary.currentTransportAllowance,
      incrementAmount: increment_amount,
      incrementPercentage: increment_percentage,
      requestedBy: session.user.id,
      requestedAt: new Date().toISOString().split('T')[0] || null,
      createdAt: new Date().toISOString().split('T')[0] || null,
      updatedAt: new Date().toISOString().split('T')[0] || null,
    };

    const [newSalaryIncrement] = await db
      .insert(salaryIncrements)
      .values(insertData)
      .returning();

    if (!newSalaryIncrement) {
      throw new Error('Failed to create salary increment');
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newSalaryIncrement.id,
        employee_id: newSalaryIncrement.employeeId,
        increment_type: newSalaryIncrement.incrementType,
        effective_date: newSalaryIncrement.effectiveDate,
        reason: newSalaryIncrement.reason,
        status: newSalaryIncrement.status,
        current_base_salary: newSalaryIncrement.currentBaseSalary,
        new_base_salary: newSalaryIncrement.newBaseSalary,
        increment_amount: newSalaryIncrement.incrementAmount,
        increment_percentage: newSalaryIncrement.incrementPercentage,
        requested_by: newSalaryIncrement.requestedBy,
        requested_at: newSalaryIncrement.requestedAt,
        created_at: newSalaryIncrement.createdAt,
        updated_at: newSalaryIncrement.updatedAt,
      },
    });
  } catch (error) {
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
