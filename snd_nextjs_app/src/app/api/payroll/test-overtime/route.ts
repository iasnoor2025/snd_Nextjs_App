import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { employees, payrolls } from '@/lib/drizzle/schema';
import { eq, gt, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing overtime calculation...');
    
    // Test basic connection first
    try {
      // Test connection with a simple query
      await db.select({ count: 1 }).from(employees).limit(1);
      console.log('✅ Database connection successful');
    } catch (connectionError) {
      console.error('❌ Database connection failed:', connectionError);
      return NextResponse.json(
        {
          success: false,
          message: 'Database connection failed: ' + (connectionError as Error).message
        },
        { status: 500 }
      );
    }
    
    // Get a sample employee with overtime settings
    const employeeData = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        basicSalary: employees.basicSalary,
        contractDaysPerMonth: employees.contractDaysPerMonth,
        contractHoursPerDay: employees.contractHoursPerDay,
        overtimeRateMultiplier: employees.overtimeRateMultiplier,
        overtimeFixedRate: employees.overtimeFixedRate
      })
      .from(employees)
      .where(
        and(
          gt(employees.overtimeFixedRate, 0)
        )
      )
      .limit(1);

    if (employeeData.length === 0) {
      // Try to find employee with multiplier instead
      const employeeWithMultiplier = await db
        .select({
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          basicSalary: employees.basicSalary,
          contractDaysPerMonth: employees.contractDaysPerMonth,
          contractHoursPerDay: employees.contractHoursPerDay,
          overtimeRateMultiplier: employees.overtimeRateMultiplier,
          overtimeFixedRate: employees.overtimeFixedRate
        })
        .from(employees)
        .where(
          and(
            gt(employees.overtimeRateMultiplier, 0)
          )
        )
        .limit(1);

      if (employeeWithMultiplier.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'No employee found with overtime settings configured'
        });
      }
      employeeData[0] = employeeWithMultiplier[0];
    }

    const employee = employeeData[0];

    // Test calculation with 2 overtime hours
    const testOvertimeHours = 2;
    const basicSalary = Number(employee.basicSalary);
    const hourlyRate = basicSalary / 30 / 8; // basic/30/8 formula

    let overtimeAmount = 0;
    let calculationMethod = '';

    if (employee.overtimeFixedRate && Number(employee.overtimeFixedRate) > 0) {
      overtimeAmount = testOvertimeHours * Number(employee.overtimeFixedRate);
      calculationMethod = `Fixed Rate: ${employee.overtimeFixedRate} SAR/hr`;
    } else {
      const overtimeMultiplier = Number(employee.overtimeRateMultiplier) || 1.5;
      overtimeAmount = testOvertimeHours * (hourlyRate * overtimeMultiplier);
      calculationMethod = `Multiplier: ${overtimeMultiplier}x (Hourly Rate: ${hourlyRate.toFixed(2)} SAR/hr - basic/30/8 formula)`;
    }

    // Get existing payrolls with overtime issues
    const payrollsWithIssuesData = await db
      .select({
        id: payrolls.id,
        month: payrolls.month,
        year: payrolls.year,
        overtimeHours: payrolls.overtimeHours,
        overtimeAmount: payrolls.overtimeAmount,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          basicSalary: employees.basicSalary,
          contractDaysPerMonth: employees.contractDaysPerMonth,
          contractHoursPerDay: employees.contractHoursPerDay,
          overtimeRateMultiplier: employees.overtimeRateMultiplier,
          overtimeFixedRate: employees.overtimeFixedRate
        }
      })
      .from(payrolls)
      .leftJoin(employees, eq(payrolls.employeeId, employees.id))
      .where(
        and(
          gt(payrolls.overtimeHours, 0),
          eq(payrolls.overtimeAmount, '0')
        )
      );

    return NextResponse.json({
      success: true,
      data: {
        test_employee: {
          id: employee.id,
          name: `${employee.firstName} ${employee.lastName}`,
          basic_salary: Number(employee.basicSalary),
          hourly_rate: hourlyRate,
          overtime_fixed_rate: Number(employee.overtimeFixedRate || 0),
          overtime_rate_multiplier: Number(employee.overtimeRateMultiplier || 1.5)
        },
        test_calculation: {
          overtime_hours: testOvertimeHours,
          calculation_method: calculationMethod,
          overtime_amount: overtimeAmount
        },
        payrolls_with_issues: payrollsWithIssuesData.map(p => ({
          id: p.id,
          employee: `${p.employee.firstName} ${p.employee.lastName}`,
          month: p.month,
          year: p.year,
          overtime_hours: Number(p.overtimeHours),
          overtime_amount: Number(p.overtimeAmount),
          employee_overtime_settings: {
            fixed_rate: Number(p.employee.overtimeFixedRate || 0),
            multiplier: Number(p.employee.overtimeRateMultiplier || 1.5)
          }
        }))
      }
    });
    
  } catch (error) {
    console.error('Overtime test error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to test overtime calculation: ' + (error as Error).message,
        error: error
      },
      { status: 500 }
    );
  }
} 