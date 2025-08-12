import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { salaryIncrements, employees, users } from '@/lib/drizzle/schema';
import { eq, and, gte, lte, like, desc, asc, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { checkPermission } from '@/lib/rbac/enhanced-permission-service';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const employeeId = searchParams.get('employee_id');
    const status = searchParams.get('status');
    const incrementType = searchParams.get('increment_type');
    const effectiveDateFrom = searchParams.get('effective_date_from');
    const effectiveDateTo = searchParams.get('effective_date_to');

    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];
    
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

    // Get total count
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(salaryIncrements)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const total = totalCount[0]?.count || 0;
    const pages = Math.ceil(total / limit);

    // Get salary increments with employee and user details
    const salaryIncrementsData = await db
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
          employee_id: employees.employeeId,
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
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(salaryIncrements.createdAt))
      .limit(limit)
      .offset(offset);

    // Transform the data to match the expected interface
    const transformedData = salaryIncrementsData.map(item => ({
      ...item,
      employee: item.employee ? {
        id: item.employee.id,
        first_name: item.employee.first_name,
        last_name: item.employee.last_name,
        employee_id: item.employee.employee_id,
      } : undefined,
      requested_by_user: item.requested_by_user ? {
        id: item.requested_by_user.id,
        name: item.requested_by_user.name,
      } : undefined,
      approved_by_user: item.approved_by_user ? {
        id: item.approved_by_user.id,
        name: item.approved_by_user.name,
      } : undefined,
      rejected_by_user: item.rejected_by_user ? {
        id: item.rejected_by_user.id,
        name: item.rejected_by_user.name,
      } : undefined,
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
    console.error('Error fetching salary increments:', error);
    
    // If table doesn't exist yet, return empty result
    if (error instanceof Error && error.message.includes('relation') && error.message.includes('does not exist')) {
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      employee_id,
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
      apply_to_allowances,
    } = body;

    // Validate required fields
    if (!employee_id || !increment_type || !reason || !effective_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get current employee salary information
    const employee = await db
      .select({
        current_base_salary: employees.basicSalary,
        current_food_allowance: employees.foodAllowance,
        current_housing_allowance: employees.housingAllowance,
        current_transport_allowance: employees.transportAllowance,
      })
      .from(employees)
      .where(eq(employees.id, employee_id))
      .limit(1);

    if (employee.length === 0) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    const currentSalary = employee[0];

    // Calculate new salary if not provided
    let calculatedNewBaseSalary = new_base_salary;
    let calculatedNewFoodAllowance = new_food_allowance;
    let calculatedNewHousingAllowance = new_housing_allowance;
    let calculatedNewTransportAllowance = new_transport_allowance;

    if (increment_type === 'percentage' && increment_percentage) {
      const percentage = increment_percentage / 100;
      calculatedNewBaseSalary = Number(currentSalary.current_base_salary) * (1 + percentage);
      
      if (apply_to_allowances) {
        calculatedNewFoodAllowance = Number(currentSalary.current_food_allowance) * (1 + percentage);
        calculatedNewHousingAllowance = Number(currentSalary.current_housing_allowance) * (1 + percentage);
        calculatedNewTransportAllowance = Number(currentSalary.current_transport_allowance) * (1 + percentage);
      }
    } else if (increment_type === 'amount' && increment_amount) {
      calculatedNewBaseSalary = Number(currentSalary.current_base_salary) + increment_amount;
    }

    // Create the salary increment record
    const [newSalaryIncrement] = await db
      .insert(salaryIncrements)
      .values({
        employeeId: employee_id,
        incrementType: increment_type,
        effectiveDate: new Date(effective_date),
        reason,
        notes,
        status: 'pending',
        currentBaseSalary: currentSalary.current_base_salary,
        currentFoodAllowance: currentSalary.current_food_allowance,
        currentHousingAllowance: currentSalary.current_housing_allowance,
        currentTransportAllowance: currentSalary.current_transport_allowance,
        newBaseSalary: calculatedNewBaseSalary || currentSalary.current_base_salary,
        newFoodAllowance: calculatedNewFoodAllowance || currentSalary.current_food_allowance,
        newHousingAllowance: calculatedNewHousingAllowance || currentSalary.current_housing_allowance,
        newTransportAllowance: calculatedNewTransportAllowance || currentSalary.current_transport_allowance,
        incrementAmount: increment_amount,
        incrementPercentage: increment_percentage,
        requestedBy: session.user.id,
        requestedAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

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
    console.error('Error creating salary increment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
