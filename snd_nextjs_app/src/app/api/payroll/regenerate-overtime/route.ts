import { db } from '@/lib/drizzle';
import { employees, payrollItems, payrolls } from '@/lib/drizzle/schema';
import { and, eq, gt, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST() {
  try {

    // Test basic connection first
    try {
      // Test connection with a simple query
      await db
        .select({ count: sql`1` })
        .from(employees)
        .limit(1);
      
    } catch (connectionError) {
      
      return NextResponse.json(
        {
          success: false,
          message: 'Database connection failed: ' + (connectionError as Error).message,
        },
        { status: 500 }
      );
    }

    // Get all payrolls that have overtime hours but 0 overtime amount
    const payrollsToUpdateData = await db
      .select({
        id: payrolls.id,
        month: payrolls.month,
        year: payrolls.year,
        overtimeHours: payrolls.overtimeHours,
        overtimeAmount: payrolls.overtimeAmount,
        baseSalary: payrolls.baseSalary,
        bonusAmount: payrolls.bonusAmount,
        deductionAmount: payrolls.deductionAmount,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          basicSalary: employees.basicSalary,
          contractDaysPerMonth: employees.contractDaysPerMonth,
          contractHoursPerDay: employees.contractHoursPerDay,
          overtimeRateMultiplier: employees.overtimeRateMultiplier,
          overtimeFixedRate: employees.overtimeFixedRate,
        },
      })
      .from(payrolls)
      .leftJoin(employees, eq(payrolls.employeeId, employees.id))
      .where(and(gt(payrolls.overtimeHours, '0'), eq(payrolls.overtimeAmount, '0')));

    const updatedPayrolls: string[] = [];
    const errors: string[] = [];

    for (const payroll of payrollsToUpdateData) {
      try {
        if (!payroll.employee) {
          
          continue;
        }

        // Calculate overtime amount based on employee's overtime settings
        let overtimeAmount = 0;
        if (Number(payroll.overtimeHours) > 0) {
          // Use the formula: basic/30/8*overtime rate
          const basicSalary = Number(payroll.employee.basicSalary);
          const hourlyRate = basicSalary / 30 / 8; // basic/30/8

          console.log(`Hourly rate calculated: ${hourlyRate}`);

          // Use employee's overtime settings
          if (
            payroll.employee.overtimeFixedRate &&
            Number(payroll.employee.overtimeFixedRate) > 0
          ) {
            // Use fixed overtime rate
            overtimeAmount =
              Number(payroll.overtimeHours) * Number(payroll.employee.overtimeFixedRate);
            console.log(`Using fixed overtime rate: ${payroll.employee.overtimeFixedRate} SAR/hr`);
          } else {
            // Use overtime multiplier with basic/30/8 formula
            const overtimeMultiplier = Number(payroll.employee.overtimeRateMultiplier) || 1.5;
            overtimeAmount = Number(payroll.overtimeHours) * (hourlyRate * overtimeMultiplier);
            console.log(`Using overtime multiplier: ${overtimeMultiplier}x basic rate`);
          }

        }

        // Update the payroll
        await db
          .update(payrolls)
          .set({
            overtimeAmount: overtimeAmount.toString(),
            finalAmount: (
              Number(payroll.baseSalary) +
              overtimeAmount +
              Number(payroll.bonusAmount) -
              Number(payroll.deductionAmount)
            ).toString(),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(payrolls.id, payroll.id));

        // Update or create overtime payroll item
        const existingOvertimeItemData = await db
          .select({ id: payrollItems.id })
          .from(payrollItems)
          .where(and(eq(payrollItems.payrollId, payroll.id), eq(payrollItems.type, 'overtime')))
          .limit(1);

        if (existingOvertimeItemData[0]) {
          // Update existing overtime item
          await db
            .update(payrollItems)
            .set({
              amount: overtimeAmount.toString(),
              description:
                payroll.employee.overtimeFixedRate && Number(payroll.employee.overtimeFixedRate) > 0
                  ? `Overtime Pay (Fixed Rate: ${payroll.employee.overtimeFixedRate} SAR/hr)`
                  : `Overtime Pay (${Number(payroll.employee.overtimeRateMultiplier) || 1.5}x Rate)`,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(payrollItems.id, existingOvertimeItemData[0].id));
        } else if (overtimeAmount > 0) {
          // Create new overtime item
          await db.insert(payrollItems).values({
            payrollId: payroll.id,
            type: 'overtime',
            description:
              payroll.employee.overtimeFixedRate && Number(payroll.employee.overtimeFixedRate) > 0
                ? `Overtime Pay (Fixed Rate: ${payroll.employee.overtimeFixedRate} SAR/hr)`
                : `Overtime Pay (${Number(payroll.employee.overtimeRateMultiplier) || 1.5}x Rate)`,
            amount: overtimeAmount.toString(),
            isTaxable: true,
            taxRate: '15',
            order: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        updatedPayrolls.push(payroll.id.toString());
        console.log(`Payroll ${payroll.id} updated successfully`);
        
      } catch (error) {
        const errorMsg = `Error updating payroll ${payroll.id}: ${error}`;
        console.error('Error updating payroll:', errorMsg);
        errors.push(errorMsg);
      }
    }

    let message =
      `Overtime recalculation completed successfully.\n` +
      `Updated: ${updatedPayrolls.length} payrolls\n` +
      `Errors: ${errors.length}`;

    if (errors.length > 0) {
      message += `\n\nErrors: ${errors.slice(0, 5).join(', ')}`;
      if (errors.length > 5) {
        message += ` and ${errors.length - 5} more...`;
      }
    }

    return NextResponse.json({
      success: true,
      message: message,
      data: {
        total_updated: updatedPayrolls.length,
        total_errors: errors.length,
        updated_payrolls: updatedPayrolls,
        errors: errors,
      },
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to recalculate overtime: ' + (error as Error).message,
        error: error,
      },
      { status: 500 }
    );
  }
}
