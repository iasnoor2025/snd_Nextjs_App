import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting payroll generation for approved timesheets...');
    
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
    
    // Get employees with approved timesheets (status can be 'approved' or 'manager_approved')
    const employeesWithApprovedTimesheets = await prisma.employee.findMany({
      where: {
        timesheets: {
          some: {
            status: {
              in: ['approved', 'manager_approved']
            }
          }
        }
      },
      include: {
        timesheets: {
          where: {
            status: {
              in: ['approved', 'manager_approved']
            }
          }
        }
      }
    });

    console.log(`Found ${employeesWithApprovedTimesheets.length} employees with approved timesheets`);

    const processedEmployees: string[] = [];
    const generatedPayrolls: string[] = [];
    const errors: string[] = [];
    let totalGenerated = 0;
    let totalSkipped = 0;

    // Process each employee
    for (const employee of employeesWithApprovedTimesheets) {
      try {
        console.log(`Processing employee: ${employee.first_name} ${employee.last_name}`);
        
        // Group timesheets by month/year
        const timesheetsByMonth = new Map<string, any[]>();
        
        employee.timesheets.forEach(timesheet => {
          const date = new Date(timesheet.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!timesheetsByMonth.has(monthKey)) {
            timesheetsByMonth.set(monthKey, []);
          }
          timesheetsByMonth.get(monthKey)!.push(timesheet);
        });

        // Process each month that has approved timesheets
        for (const [monthKey, timesheets] of timesheetsByMonth) {
          const [year, month] = monthKey.split('-').map(Number);
          
          // Check if payroll already exists for this month
          const existingPayroll = await prisma.payroll.findFirst({
            where: {
              employee_id: employee.id,
              month: month,
              year: year
            }
          });

          if (existingPayroll) {
            console.log(`Payroll already exists for ${employee.first_name} ${employee.last_name} - ${month}/${year}`);
            totalSkipped++;
            continue;
          }

          // Calculate payroll based on timesheets for this month
          const totalHours = timesheets.reduce((sum, ts) => sum + Number(ts.hours_worked), 0);
          const totalOvertimeHours = timesheets.reduce((sum, ts) => sum + Number(ts.overtime_hours), 0);

          const overtimeAmount = totalOvertimeHours * (Number(employee.basic_salary) / 160) * 1.5;
          const bonusAmount = 0; // Manual setting only
          const deductionAmount = 0; // Manual setting only
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
              notes: `Generated from approved timesheets for ${month}/${year}`,
              currency: 'SAR'
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
              }
            ]
          });

          console.log(`Generated payroll for ${employee.first_name} ${employee.last_name} - ${month}/${year}`);
          processedEmployees.push(`${employee.first_name} ${employee.last_name} (${month}/${year})`);
          generatedPayrolls.push(payroll.id.toString());
          totalGenerated++;
        }

      } catch (error) {
        const errorMsg = `Error processing ${employee.first_name} ${employee.last_name}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
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
    console.error('Payroll generation error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate payroll: ' + (error as Error).message,
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
