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

    let processedEmployees = [];
    let generatedPayrolls = [];
    let errors = [];
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
            employeeId: employee.id,
            month: currentMonth,
            year: currentYear
          }
        });

        if (existingPayroll) {
          totalSkipped++;
          continue;
        }

        // Calculate payroll based on timesheets
        const totalHours = employee.timesheets.reduce((sum, ts) => sum + ts.hoursWorked, 0);
        const totalOvertimeHours = employee.timesheets.reduce((sum, ts) => sum + ts.overtimeHours, 0);

        const overtimeAmount = totalOvertimeHours * (employee.basicSalary / 160) * 1.5;
        const bonusAmount = Math.random() * 300; // Random bonus
        const deductionAmount = employee.basicSalary * 0.15; // 15% tax
        const finalAmount = employee.basicSalary + overtimeAmount + bonusAmount - deductionAmount;

        // Create payroll
        const payroll = await prisma.payroll.create({
          data: {
            employeeId: employee.id,
            month: currentMonth,
            year: currentYear,
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
              amount: deductionAmount,
              isTaxable: false,
              taxRate: 0,
              order: 4
            }
          ]
        });

        processedEmployees.push(employee.fullName);
        generatedPayrolls.push(payroll);
        totalGenerated++;

      } catch (error) {
        errors.push(`Error processing ${employee.fullName}: ${error}`);
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
