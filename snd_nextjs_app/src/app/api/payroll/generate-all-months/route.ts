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
              employee_id: employee.id,
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
              employee_id: employee.id,
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
          const totalHours = timesheets.reduce((sum, ts) => sum + Number(ts.hours_worked), 0);
          const totalOvertimeHours = timesheets.reduce((sum, ts) => sum + Number(ts.overtime_hours), 0);

          const overtimeAmount = totalOvertimeHours * (Number(employee.basic_salary) / 160) * 1.5;
          const bonusAmount = Math.random() * 300; // Random bonus
          const deductionAmount = Number(employee.basic_salary) * 0.15; // 15% tax
          const finalAmount = Number(employee.basic_salary) + overtimeAmount + bonusAmount - deductionAmount;

          // Create payroll
          const payroll = await prisma.payroll.create({
            data: {
              employee_id: employee.id,
              month: month,
              year: year,
              base_salary: Number(employee.basic_salary),
              overtime_amount: overtimeAmount,
              bonus_amount: bonusAmount,
              deduction_amount: deductionAmount,
              advance_deduction: 0,
              final_amount: finalAmount,
              total_worked_hours: totalHours,
              overtime_hours: totalOvertimeHours,
              status: 'pending',
              notes: 'Generated from approved timesheets',
              currency: 'USD'
            }
          });

          // Create payroll items
          await prisma.payrollItem.createMany({
            data: [
              {
                payroll_id: payroll.id,
                type: 'earnings',
                description: 'Basic Salary',
                amount: Number(employee.basic_salary),
                is_taxable: true,
                tax_rate: 15,
                order: 1
              },
              {
                payroll_id: payroll.id,
                type: 'overtime',
                description: 'Overtime Pay',
                amount: overtimeAmount,
                is_taxable: true,
                tax_rate: 15,
                order: 2
              },
              {
                payroll_id: payroll.id,
                type: 'bonus',
                description: 'Performance Bonus',
                amount: bonusAmount,
                is_taxable: true,
                tax_rate: 15,
                order: 3
              },
              {
                payroll_id: payroll.id,
                type: 'deduction',
                description: 'Tax Deduction',
                amount: -deductionAmount,
                is_taxable: false,
                tax_rate: 0,
                order: 4
              }
            ]
          });

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