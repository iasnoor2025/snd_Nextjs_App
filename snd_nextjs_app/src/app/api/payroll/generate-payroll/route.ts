import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Get employees with manager-approved timesheets
    const employeesWithApprovedTimesheets = await prisma.employee.findMany({
      where: {
        timesheets: {
          some: {
            status: 'manager_approved'
          }
        }
      },
      include: {
        timesheets: {
          where: {
            status: 'manager_approved'
          }
        }
      }
    });

    const processedEmployees: string[] = [];
    const generatedPayrolls: string[] = [];
    const errors: string[] = [];
    let totalGenerated = 0;
    let totalSkipped = 0;

    // Process each employee
    for (const employee of employeesWithApprovedTimesheets) {
      try {
        // Check if payroll already exists for current month
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        const existingPayroll = await prisma.payroll.findFirst({
          where: {
            employee_id: employee.id,
            month: currentMonth,
            year: currentYear
          }
        });

        if (existingPayroll) {
          totalSkipped++;
          continue;
        }

        // Calculate payroll based on timesheets
        const totalHours = employee.timesheets.reduce((sum, ts) => sum + Number(ts.hours_worked), 0);
        const totalOvertimeHours = employee.timesheets.reduce((sum, ts) => sum + Number(ts.overtime_hours), 0);

        const overtimeAmount = totalOvertimeHours * (Number(employee.basic_salary) / 160) * 1.5;
        const bonusAmount = Math.random() * 300; // Random bonus
        const deductionAmount = Number(employee.basic_salary) * 0.15; // 15% tax
        const finalAmount = Number(employee.basic_salary) + overtimeAmount + bonusAmount - deductionAmount;

        // Create payroll
        const payroll = await prisma.payroll.create({
          data: {
            employee_id: employee.id,
            month: currentMonth,
            year: currentYear,
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
              amount: deductionAmount,
              is_taxable: false,
              tax_rate: 0,
              order: 4
            }
          ]
        });

        processedEmployees.push(`${employee.first_name} ${employee.last_name}`);
        generatedPayrolls.push(payroll.id.toString());
        totalGenerated++;

      } catch (error) {
        errors.push(`Error processing ${employee.first_name} ${employee.last_name}: ${error}`);
      }
    }

    // Create payroll run record
    const payrollRun = await prisma.payrollRun.create({
      data: {
        batch_id: `BATCH_APPROVED_${Date.now()}`,
        run_date: new Date(),
        status: 'pending',
        run_by: 1,
        total_employees: processedEmployees.length,
        notes: `Payroll generation for employees with approved timesheets - Generated: ${totalGenerated}`
      }
    });

    let message = `Payroll generation completed successfully.\n` +
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
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate payroll: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}
