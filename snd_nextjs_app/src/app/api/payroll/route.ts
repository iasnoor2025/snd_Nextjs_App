import { db } from '@/lib/drizzle';
import { departments, designations, employees, payrollItems, payrolls } from '@/lib/drizzle/schema';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { cacheQueryResult, generateCacheKey, CACHE_TAGS } from '@/lib/redis';

export async function GET(_request: NextRequest) {
  try {
    const { searchParams } = new URL(_request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const employeeId = searchParams.get('employee_id');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const status = searchParams.get('status');

    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions: any[] = [];

    if (search) {
      whereConditions.push(
        sql`(${employees.firstName} ILIKE ${`%${search}%`} OR ${employees.lastName} ILIKE ${`%${search}%`} OR ${employees.fileNumber} ILIKE ${`%${search}%`})`
      );
    }

    if (employeeId) {
      whereConditions.push(eq(payrolls.employeeId, parseInt(employeeId)));
    }

    if (month) {
      whereConditions.push(eq(payrolls.month, parseInt(month)));
    }

    if (year) {
      whereConditions.push(eq(payrolls.year, parseInt(year)));
    }

    if (status && status !== 'all') {
      whereConditions.push(eq(payrolls.status, status));
    }

    // Generate cache key based on filters and pagination
    const cacheKey = generateCacheKey('payroll', 'list', { page, limit, search, employeeId, month, year, status });
    
    return await cacheQueryResult(
      cacheKey,
      async () => {
        // Get total count for pagination
        const totalResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(payrolls)
          .leftJoin(employees, eq(payrolls.employeeId, employees.id))
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

        const total = totalResult[0]?.count || 0;

        // Get payrolls with employee, department, and designation data
        const payrollsQuery = db
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
            },
          })
          .from(payrolls)
          .leftJoin(employees, eq(payrolls.employeeId, employees.id))
          .leftJoin(departments, eq(employees.departmentId, departments.id))
          .leftJoin(designations, eq(employees.designationId, designations.id))
          .orderBy(desc(payrolls.createdAt))
          .limit(limit)
          .offset(offset);

        if (whereConditions.length > 0) {
          payrollsQuery.where(and(...whereConditions));
        }

        const payrollsData = await payrollsQuery;

        // Get payroll items for each payroll
        const payrollIds = payrollsData.map(p => p.id);
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
          })
          .from(payrollItems)
          .where(inArray(payrollItems.payrollId, payrollIds))
          .orderBy(asc(payrollItems.order));

        // Group payroll items by payroll ID and transform to match frontend format
        const payrollItemsMap = new Map();
        payrollItemsData.forEach(item => {
          if (!payrollItemsMap.has(item.payrollId)) {
            payrollItemsMap.set(item.payrollId, []);
          }
          payrollItemsMap.get(item.payrollId).push({
            id: item.id,
            payroll_id: item.payrollId,
            type: item.type,
            description: item.description,
            amount: Number(item.amount),
            is_taxable: item.isTaxable,
            tax_rate: Number(item.taxRate),
            order: item.order,
          });
        });

        // Transform data to match frontend expectations (snake_case)
        const result = payrollsData.map(payroll => ({
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
          currency: payroll.currency,
          created_at: payroll.createdAt,
          updated_at: payroll.updatedAt,
          employee: {
            id: payroll.employee?.id || 0,
            first_name: payroll.employee?.firstName || '',
            last_name: payroll.employee?.lastName || '',
            full_name: payroll.employee
              ? `${payroll.employee.firstName} ${payroll.employee.lastName}`
              : '',
            file_number: payroll.employee?.fileNumber || '',
            basic_salary: Number(payroll.employee?.basicSalary || 0),
            department: payroll.department?.name || '',
            designation: payroll.designation?.name || '',
            status: 'active', // Default status
          },
          items: payrollItemsMap.get(payroll.id) || [],
        }));

        return NextResponse.json({
          success: true,
          data: result,
          current_page: page,
          last_page: Math.ceil(total / limit),
          per_page: limit,
          total,
          from: offset + 1,
          to: Math.min(offset + limit, total),
          next_page_url: page < Math.ceil(total / limit) ? `?page=${page + 1}` : null,
          prev_page_url: page > 1 ? `?page=${page - 1}` : null,
          first_page_url: '?page=1',
          last_page_url: `?page=${Math.ceil(total / limit)}`,
          path: '/api/payroll',
          links: [],
        });
             },
       {
         ttl: 300, // 5 minutes
         tags: [CACHE_TAGS.PAYROLL, CACHE_TAGS.EMPLOYEES],
       }
     );
  } catch (error) {
    
    return NextResponse.json(
      { success: false, message: 'Failed to fetch payrolls' },
      { status: 500 }
    );
  }
}

export async function POST(_request: NextRequest) {
  try {
    const body = await _request.json();

    // Validate required fields
    const requiredFields = ['employeeId', 'month', 'year', 'baseSalary'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, message: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if payroll already exists for this employee and month/year
    const existingPayroll = await db
      .select({ id: payrolls.id })
      .from(payrolls)
      .where(
        and(
          eq(payrolls.employeeId, body.employeeId),
          eq(payrolls.month, body.month),
          eq(payrolls.year, body.year)
        )
      )
      .limit(1);

    if (existingPayroll.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Payroll already exists for this employee and month/year' },
        { status: 400 }
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
      console.log(`Absent deduction calculation: (${baseSalary} / ${daysInMonth}) * ${body.absentDays} = ${absentDeduction}`);
    }

    const finalAmount =
      baseSalary +
      overtimeAmount +
      bonusAmount -
      deductionAmount -
      absentDeduction -
      advanceDeduction;

    // Create payroll
    const insertedPayrolls = await db
      .insert(payrolls)
      .values({
        employeeId: body.employeeId,
        month: body.month,
        year: body.year,
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
        currency: body.currency || 'SAR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    const payroll = insertedPayrolls[0];
    if (!payroll) {
      return NextResponse.json(
        { success: false, message: 'Failed to create payroll' },
        { status: 500 }
      );
    }

    // Create payroll items if provided
    if (body.items && Array.isArray(body.items)) {
      const payrollItemsData = body.items.map((item: any, index: number) => ({
        payrollId: payroll.id,
        type: item.type || 'earnings',
        description: item.description || '',
        amount: (item.amount || 0).toString(),
        isTaxable: item.isTaxable || false,
        taxRate: (item.taxRate || 0).toString(),
        order: index + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      await db.insert(payrollItems).values(payrollItemsData);
    }

    return NextResponse.json({
      success: true,
      message: 'Payroll created successfully',
      data: payroll,
    });
  } catch (error) {
    console.error('Error creating payroll:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create payroll' },
      { status: 500 }
    );
  }
}
