import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { employees, timesheets, payrolls, payrollItems, payrollRuns } from '@/lib/drizzle/schema';
import { eq, and, gte, lt } from 'drizzle-orm';

export async function $1(_request: NextRequest) {
  try {
    const { start_month, end_month } = await request.json();

    if (!start_month || !end_month) {
      return NextResponse.json(
        { success: false, message: 'Start month and end month are required' },
        { status: 400 }
      );
    }

    const now = new Date();
    const startDate = new Date(start_month + '-01');
    const endDate = end_month ? new Date(end_month + '-01') : new Date(now.getFullYear(), now.getMonth(), 1);

    const processedEmployees: string[] = [];
    const generatedPayrolls: string[] = [];
    const errors: string[] = [];
    let totalGenerated = 0;
    let totalSkipped = 0;

    // Get all active employees
    const employeesData = await db
      .select({
        id: employees.id,
        basicSalary: employees.basicSalary,
      })
      .from(employees)
      .where(eq(employees.status, 'active'));

    // Process each employee
    for (const employee of employeesData) {
      try {
        // Generate payrolls for each month in the range
        const current = new Date(startDate);
        while (current <= endDate) {
          const month = current.getMonth() + 1;
          const year = current.getFullYear();

          // Check if payroll already exists for this month
          const existingPayrollData = await db
            .select({ id: payrolls.id })
            .from(payrolls)
            .where(
              and(
                eq(payrolls.employeeId, employee.id),
                eq(payrolls.month, month),
                eq(payrolls.year, year)
              )
            )
            .limit(1);

          if (existingPayrollData[0]) {
            totalSkipped++;
            current.setMonth(current.getMonth() + 1);
            continue;
          }

          // Check if employee has approved timesheets for this month
          const timesheetsData = await db
            .select({
              hoursWorked: timesheets.hoursWorked,
              overtimeHours: timesheets.overtimeHours,
            })
            .from(timesheets)
            .where(
              and(
                eq(timesheets.employeeId, employee.id),
                eq(timesheets.status, 'manager_approved'),
                gte(timesheets.date, new Date(year, month - 1, 1).toISOString()),
                lt(timesheets.date, new Date(year, month, 1).toISOString())
              )
            );

          if (timesheetsData.length === 0) {
            totalSkipped++;
            current.setMonth(current.getMonth() + 1);
            continue;
          }

          // Calculate payroll based on timesheets
          const totalHours = timesheetsData.reduce((sum, ts) => sum + Number(ts.hoursWorked), 0);
          const totalOvertimeHours = timesheetsData.reduce((sum, ts) => sum + Number(ts.overtimeHours), 0);

          const overtimeAmount = totalOvertimeHours * (Number(employee.basicSalary) / 160) * 1.5;
          const bonusAmount = 0; // Manual setting only
          const deductionAmount = 0; // Manual setting only
          const finalAmount = Number(employee.basicSalary) + overtimeAmount + bonusAmount - deductionAmount;

          // Create payroll
          const insertedPayrolls = await db
            .insert(payrolls)
            .values({
              employeeId: employee.id,
              month: month,
              year: year,
              baseSalary: Number(employee.basicSalary).toString(),
              overtimeAmount: overtimeAmount.toString(),
              bonusAmount: bonusAmount.toString(),
              deductionAmount: deductionAmount.toString(),
              advanceDeduction: '0',
              finalAmount: finalAmount.toString(),
              totalWorkedHours: totalHours.toString(),
              overtimeHours: totalOvertimeHours.toString(),
              status: 'pending',
              notes: 'Generated from approved timesheets',
              currency: 'USD',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .returning();

          const payroll = insertedPayrolls[0];
          
          if (!payroll) {
            throw new Error('Failed to create payroll record');
          }

          // Create payroll items
          await db
            .insert(payrollItems)
            .values([
              {
                payrollId: payroll.id,
                type: 'earnings',
                description: 'Basic Salary',
                amount: Number(employee.basicSalary).toString(),
                isTaxable: true,
                taxRate: '15',
                order: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                payrollId: payroll.id,
                type: 'overtime',
                description: 'Overtime Pay',
                amount: overtimeAmount.toString(),
                isTaxable: true,
                taxRate: '15',
                order: 2,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            ]);

          generatedPayrolls.push(payroll.id.toString());
          totalGenerated++;
          current.setMonth(current.getMonth() + 1);
        }

        processedEmployees.push(employee.id.toString());
      } catch (error) {
        errors.push(`Employee ${employee.id}: ${(error as Error).message}`);
      }
    }

    // Create payroll run record
    const insertedPayrollRuns = await db
      .insert(payrollRuns)
      .values({
        batchId: `BATCH_ALL_${Date.now()}`,
        runDate: new Date().toISOString(),
        status: 'pending',
        runBy: 1,
        totalEmployees: processedEmployees.length,
        notes: `Multi-month payroll run - Generated: ${totalGenerated}, Skipped: ${totalSkipped}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    const payrollRun = insertedPayrollRuns[0];
    
    if (!payrollRun) {
      throw new Error('Failed to create payroll run record');
    }

    let message = `Payroll generation completed successfully.\n` +
      `Generated: ${totalGenerated} payrolls\n` +
      `Skipped: ${totalSkipped} months (already exists or no approved timesheets)\n` +
      `Errors: ${errors.length}`;

    if (processedEmployees.length > 0) {
      message += `\n\nProcessed employees: ${processedEmployees.map(id => id.toString()).join(', ')}`;
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
        total_generated: totalGenerated,
        total_skipped: totalSkipped,
        total_errors: errors.length,
        processed_employees: processedEmployees,
        errors: errors
      },
      payroll_run_id: payrollRun.id
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate payroll for all months: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}
