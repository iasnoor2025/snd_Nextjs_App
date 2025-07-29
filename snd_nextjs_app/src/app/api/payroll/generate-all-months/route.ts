import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
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
    const employees = await prisma.employee.findMany({
      where: { status: 'active' }
    });

    // Process each employee
    for (const employee of employees) {
      try {
        // Generate payrolls for each month in the range
        const current = new Date(startDate);
        while (current <= endDate) {
          const month = current.getMonth() + 1;
          const year = current.getFullYear();

          // Check if payroll already exists for this month
          const existingPayroll = await prisma.payroll.findFirst({
            where: {
              employeeId: employee.id,
              month: month,
              year: year
            }
          });

          if (existingPayroll) {
            totalSkipped++;
            current.setMonth(current.getMonth() + 1);
            continue;
          }

          // Check if employee has approved timesheets for this month
          const timesheets = await prisma.timesheet.findMany({
            where: {
              employeeId: employee.id,
              status: 'manager_approved',
              date: {
                gte: new Date(year, month - 1, 1),
                lt: new Date(year, month, 1)
              }
            }
          });

          if (timesheets.length === 0) {
            totalSkipped++;
            current.setMonth(current.getMonth() + 1);
            continue;
          }

          // Calculate payroll based on timesheets
          const totalHours = timesheets.reduce((sum, ts) => sum + ts.hoursWorked, 0);
          const totalOvertimeHours = timesheets.reduce((sum, ts) => sum + ts.overtimeHours, 0);

          const overtimeAmount = totalOvertimeHours * (employee.basicSalary / 160) * 1.5;
          const bonusAmount = Math.random() * 300; // Random bonus
          const deductionAmount = employee.basicSalary * 0.15; // 15% tax
          const finalAmount = employee.basicSalary + overtimeAmount + bonusAmount - deductionAmount;

          // Create payroll
          const payroll = await prisma.payroll.create({
            data: {
              employeeId: employee.id,
              month: month,
              year: year,
              baseSalary: employee.basicSalary,
              overtimeAmount: overtimeAmount,
              bonusAmount: bonusAmount,
              deductionAmount: deductionAmount,
              advanceDeduction: 0,
              finalAmount: finalAmount,
              totalWorkedHours: totalHours,
              overtimeHours: totalOvertimeHours,
              status: 'pending',
              notes: 'Generated from approved timesheets',
              currency: 'USD'
            }
          });

          // Create payroll items
          await prisma.payrollItem.createMany({
            data: [
              {
                payrollId: payroll.id,
                type: 'earnings',
                description: 'Basic Salary',
                amount: employee.basicSalary,
                isTaxable: true,
                taxRate: 15,
                order: 1
              },
              {
                payrollId: payroll.id,
                type: 'overtime',
                description: 'Overtime Pay',
                amount: overtimeAmount,
                isTaxable: true,
                taxRate: 15,
                order: 2
              },
              {
                payrollId: payroll.id,
                type: 'bonus',
                description: 'Performance Bonus',
                amount: bonusAmount,
                isTaxable: true,
                taxRate: 15,
                order: 3
              },
              {
                payrollId: payroll.id,
                type: 'deduction',
                description: 'Tax Deduction',
                amount: -deductionAmount,
                isTaxable: false,
                taxRate: 0,
                order: 4
              }
            ]
          });

          generatedPayrolls.push(payroll.id);
          totalGenerated++;
          current.setMonth(current.getMonth() + 1);
        }

        processedEmployees.push(employee.id);
      } catch (error) {
        errors.push(`Employee ${employee.id}: ${(error as Error).message}`);
      }
    }

    // Create payroll run record
    const payrollRun = await prisma.payrollRun.create({
      data: {
        batch_id: `BATCH_ALL_${Date.now()}`,
        run_date: new Date(),
        status: 'pending',
        run_by: 1,
        total_employees: processedEmployees.length,
        notes: `Multi-month payroll run - Generated: ${totalGenerated}, Skipped: ${totalSkipped}`
      }
    });

    let message = `Payroll generation completed successfully.\n` +
      `Generated: ${totalGenerated} payrolls\n` +
      `Skipped: ${totalSkipped} months (already exists or no approved timesheets)\n` +
      `Errors: ${errors.length}`;

    if (processedEmployees.length > 0) {
      message += `\n\nProcessed employees: ${processedEmployees.join(', ')}`;
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