import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing overtime calculation...');
    
    // Test basic connection first
    try {
      await prisma.$connect();
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
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { overtime_fixed_rate: { gt: 0 } },
          { overtime_rate_multiplier: { gt: 0 } }
        ]
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        basic_salary: true,
        contract_days_per_month: true,
        contract_hours_per_day: true,
        overtime_rate_multiplier: true,
        overtime_fixed_rate: true
      }
    });

    if (!employee) {
      return NextResponse.json({
        success: false,
        message: 'No employee found with overtime settings configured'
      });
    }

         // Test calculation with 2 overtime hours
     const testOvertimeHours = 2;
     const basicSalary = Number(employee.basic_salary);
     const hourlyRate = basicSalary / 30 / 8; // basic/30/8 formula

     let overtimeAmount = 0;
     let calculationMethod = '';

     if (employee.overtime_fixed_rate && employee.overtime_fixed_rate > 0) {
       overtimeAmount = testOvertimeHours * Number(employee.overtime_fixed_rate);
       calculationMethod = `Fixed Rate: ${employee.overtime_fixed_rate} SAR/hr`;
     } else {
       const overtimeMultiplier = employee.overtime_rate_multiplier || 1.5;
       overtimeAmount = testOvertimeHours * (hourlyRate * overtimeMultiplier);
       calculationMethod = `Multiplier: ${overtimeMultiplier}x (Hourly Rate: ${hourlyRate.toFixed(2)} SAR/hr - basic/30/8 formula)`;
     }

    // Get existing payrolls with overtime issues
    const payrollsWithIssues = await prisma.payroll.findMany({
      where: {
        overtime_hours: {
          gt: 0
        },
        overtime_amount: 0
      },
      include: {
        employee: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            basic_salary: true,
            contract_days_per_month: true,
            contract_hours_per_day: true,
            overtime_rate_multiplier: true,
            overtime_fixed_rate: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
                 test_employee: {
           id: employee.id,
           name: `${employee.first_name} ${employee.last_name}`,
           basic_salary: Number(employee.basic_salary),
           hourly_rate: hourlyRate,
           overtime_fixed_rate: Number(employee.overtime_fixed_rate || 0),
           overtime_rate_multiplier: Number(employee.overtime_rate_multiplier || 1.5)
         },
        test_calculation: {
          overtime_hours: testOvertimeHours,
          calculation_method: calculationMethod,
          overtime_amount: overtimeAmount
        },
        payrolls_with_issues: payrollsWithIssues.map(p => ({
          id: p.id,
          employee: `${p.employee.first_name} ${p.employee.last_name}`,
          month: p.month,
          year: p.year,
          overtime_hours: p.overtime_hours,
          overtime_amount: p.overtime_amount,
          employee_overtime_settings: {
            fixed_rate: Number(p.employee.overtime_fixed_rate || 0),
            multiplier: Number(p.employee.overtime_rate_multiplier || 1.5)
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
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError);
    }
  }
} 