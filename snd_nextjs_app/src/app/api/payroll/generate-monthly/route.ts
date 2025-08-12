import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { employees, timesheets, payrolls, payrollItems, payrollRuns } from '@/lib/drizzle/schema';
import { eq, and, inArray, gte, lt } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { month, year, employeeIds } = body;

    if (!month || !year) {
      return NextResponse.json(
        { success: false, message: 'Month and year are required' },
        { status: 400 }
      );
    }

    // Validate month and year
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { success: false, message: 'Invalid month. Must be 1-12' },
        { status: 400 }
      );
    }
    
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2030) {
      return NextResponse.json(
        { success: false, message: 'Invalid year. Must be between 2020-2030' },
        { status: 400 }
      );
    }

    // Get employees to process
    let employeesToProcess;
    if (employeeIds && Array.isArray(employeeIds) && employeeIds.length > 0) {
      // Process specific employees
      employeesToProcess = await db
        .select({
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          basicSalary: employees.basicSalary,
          contractDaysPerMonth: employees.contractDaysPerMonth,
          contractHoursPerDay: employees.contractHoursPerDay,
          overtimeRateMultiplier: employees.overtimeRateMultiplier,
          overtimeFixedRate: employees.overtimeFixedRate,
        })
        .from(employees)
        .where(
          and(
            eq(employees.status, 'active'),
            inArray(employees.id, employeeIds)
          )
        );
    } else {
      // Process all active employees
      employeesToProcess = await db
        .select({
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          basicSalary: employees.basicSalary,
          contractDaysPerMonth: employees.contractDaysPerMonth,
          contractHoursPerDay: employees.contractHoursPerDay,
          overtimeRateMultiplier: employees.overtimeRateMultiplier,
          overtimeFixedRate: employees.overtimeFixedRate,
        })
        .from(employees)
        .where(eq(employees.status, 'active'));
    }

    console.log(`Processing ${employeesToProcess.length} employees for ${month}/${year}`);

    const processedEmployees: string[] = [];
    const generatedPayrolls: string[] = [];
    const errors: string[] = [];
    let totalGenerated = 0;
    let totalSkipped = 0;

    // Process each employee
    for (const employee of employeesToProcess) {
      try {
        console.log(`Processing employee: ${employee.firstName} ${employee.lastName}`);
        
        // Check if payroll already exists for this month/year
        const existingPayroll = await db
          .select({ id: payrolls.id })
          .from(payrolls)
          .where(
            and(
              eq(payrolls.employeeId, employee.id),
              eq(payrolls.month, monthNum),
              eq(payrolls.year, yearNum)
            )
          )
          .limit(1);

        if (existingPayroll.length > 0) {
          console.log(`Payroll already exists for ${employee.firstName} ${employee.lastName} - ${month}/${year}`);
          totalSkipped++;
          continue;
        }

        // Get timesheets for this employee and month/year
        const monthTimesheets = await db
          .select({
            id: timesheets.id,
            date: timesheets.date,
            hoursWorked: timesheets.hoursWorked,
            overtimeHours: timesheets.overtimeHours,
            status: timesheets.status,
          })
          .from(timesheets)
          .where(
            and(
              eq(timesheets.employeeId, employee.id),
              gte(timesheets.date, new Date(yearNum, monthNum - 1, 1).toISOString()),
              lt(timesheets.date, new Date(yearNum, monthNum, 1).toISOString())
            )
          );

        // Calculate totals
        const totalHours = monthTimesheets.reduce((sum, ts) => sum + Number(ts.hoursWorked || 0), 0);
        const totalOvertimeHours = monthTimesheets.reduce((sum, ts) => sum + Number(ts.overtimeHours || 0), 0);

        // Calculate overtime amount
        let overtimeAmount = 0;
        if (totalOvertimeHours > 0) {
          const basicSalary = Number(employee.basicSalary);
          const hourlyRate = basicSalary / 30 / 8; // basic/30/8

          if (employee.overtimeFixedRate && Number(employee.overtimeFixedRate) > 0) {
            overtimeAmount = totalOvertimeHours * Number(employee.overtimeFixedRate);
          } else {
            const overtimeMultiplier = Number(employee.overtimeRateMultiplier) || 1.5;
            overtimeAmount = totalOvertimeHours * (hourlyRate * overtimeMultiplier);
          }
        }

        const bonusAmount = 0; // Manual setting only
        const deductionAmount = 0; // Manual setting only
        const finalAmount = Number(employee.basicSalary) + overtimeAmount + bonusAmount - deductionAmount;

        // Create payroll
        const insertedPayrolls = await db
          .insert(payrolls)
          .values({
            employeeId: employee.id,
            month: monthNum,
            year: yearNum,
            baseSalary: employee.basicSalary?.toString() || '0',
            overtimeAmount: overtimeAmount.toString(),
            bonusAmount: bonusAmount.toString(),
            deductionAmount: deductionAmount.toString(),
            advanceDeduction: '0',
            finalAmount: finalAmount.toString(),
            totalWorkedHours: totalHours.toString(),
            overtimeHours: totalOvertimeHours.toString(),
            status: 'pending',
            notes: `Generated for ${month}/${year}`,
            currency: 'SAR',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .returning();

        const payroll = insertedPayrolls[0];

        // Create payroll items
        const payrollItemsData = [
          {
            payrollId: payroll.id,
            type: 'earnings',
            description: 'Basic Salary',
            amount: employee.basicSalary?.toString() || '0',
            isTaxable: true,
            taxRate: '15',
            order: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ];

        if (totalOvertimeHours > 0) {
          let overtimeDescription = 'Overtime Pay';
          if (employee.overtimeFixedRate && Number(employee.overtimeFixedRate) > 0) {
            overtimeDescription = `Overtime Pay (Fixed Rate: ${employee.overtimeFixedRate} SAR/hr)`;
          } else {
            const overtimeMultiplier = Number(employee.overtimeRateMultiplier) || 1.5;
            overtimeDescription = `Overtime Pay (${overtimeMultiplier}x Rate)`;
          }

          payrollItemsData.push({
            payrollId: payroll.id,
            type: 'overtime',
            description: overtimeDescription,
            amount: overtimeAmount.toString(),
            isTaxable: true,
            taxRate: '15',
            order: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        await db
          .insert(payrollItems)
          .values(payrollItemsData);

        console.log(`Generated payroll for ${employee.firstName} ${employee.lastName} - ${month}/${year}`);
        processedEmployees.push(`${employee.firstName} ${employee.lastName}`);
        generatedPayrolls.push(payroll.id.toString());
        totalGenerated++;

      } catch (error) {
        const errorMsg = `Error processing ${employee.firstName} ${employee.lastName}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // Create payroll run record
    const insertedPayrollRuns = await db
      .insert(payrollRuns)
      .values({
        batchId: `BATCH_MONTHLY_${month}_${year}_${Date.now()}`,
        runDate: new Date().toISOString(),
        status: 'pending',
        runBy: 1, // Default user ID
        totalEmployees: processedEmployees.length,
        notes: `Monthly payroll generation for ${month}/${year} - Generated: ${totalGenerated}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    const payrollRun = insertedPayrollRuns[0];

    let message = `Monthly payroll generation completed for ${month}/${year}.\n` +
      `Generated: ${totalGenerated} payrolls\n` +
      `Processed employees: ${processedEmployees.length}\n` +
      `Skipped employees: ${totalSkipped}\n` +
      `Errors: ${errors.length}`;

    if (processedEmployees.length > 0) {
      message += `\n\nProcessed: ${processedEmployees.join(', ')}`;
    }

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
        month: monthNum,
        year: yearNum,
        total_generated: totalGenerated,
        total_processed_employees: processedEmployees.length,
        total_skipped_employees: totalSkipped,
        total_errors: errors.length,
        processed_employees: processedEmployees,
        errors: errors
      },
      payroll_run_id: payrollRun.id
    });

  } catch (error) {
    console.error('Monthly payroll generation error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate monthly payroll: ' + (error as Error).message,
        error: error
      },
      { status: 500 }
    );
  }
}
