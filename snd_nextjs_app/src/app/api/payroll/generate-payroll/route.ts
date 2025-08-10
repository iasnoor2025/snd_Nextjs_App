import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { employees, timesheets, payrolls, payrollItems, payrollRuns } from '@/lib/drizzle/schema';
import { eq, and, inArray } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting payroll generation for approved timesheets...');
    
    // Test basic connection first
    try {
      // Test connection by running a simple query
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
    
    // Get employees with approved timesheets (status can be 'approved' or 'manager_approved')
    const employeesWithApprovedTimesheets = await db
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
          // We'll get timesheets separately to avoid complex joins
        )
      );

    console.log(`Found ${employeesWithApprovedTimesheets.length} active employees`);

    const processedEmployees: string[] = [];
    const generatedPayrolls: string[] = [];
    const errors: string[] = [];
    let totalGenerated = 0;
    let totalSkipped = 0;

    // Process each employee
    for (const employee of employeesWithApprovedTimesheets) {
      try {
        console.log(`Processing employee: ${employee.firstName} ${employee.lastName}`);
        console.log(`Employee data:`, {
          id: employee.id,
          basic_salary: employee.basicSalary,
          contract_days_per_month: employee.contractDaysPerMonth,
          contract_hours_per_day: employee.contractHoursPerDay,
          overtime_rate_multiplier: employee.overtimeRateMultiplier,
          overtime_fixed_rate: employee.overtimeFixedRate
        });
        
        // Get approved timesheets for this employee
        const approvedTimesheets = await db
          .select({
            id: timesheets.id,
            date: timesheets.date,
            hoursWorked: timesheets.hoursWorked,
            overtimeHours: timesheets.overtimeHours,
          })
          .from(timesheets)
          .where(
            and(
              eq(timesheets.employeeId, employee.id),
              inArray(timesheets.status, ['approved', 'manager_approved'])
            )
          );

        if (approvedTimesheets.length === 0) {
          console.log(`No approved timesheets found for ${employee.firstName} ${employee.lastName}`);
          continue;
        }

        console.log(`Found ${approvedTimesheets.length} approved timesheets for ${employee.firstName} ${employee.lastName}`);
        
        // Group timesheets by month/year
        const timesheetsByMonth = new Map<string, any[]>();
        
        approvedTimesheets.forEach(timesheet => {
          const date = new Date(timesheet.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!timesheetsByMonth.has(monthKey)) {
            timesheetsByMonth.set(monthKey, []);
          }
          timesheetsByMonth.get(monthKey)!.push(timesheet);
        });

        // Process each month that has approved timesheets
        for (const [monthKey, monthTimesheets] of timesheetsByMonth) {
          const [year, month] = monthKey.split('-').map(Number);
          
          // Check if payroll already exists for this month
          const existingPayroll = await db
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

          if (existingPayroll.length > 0) {
            console.log(`Payroll already exists for ${employee.firstName} ${employee.lastName} - ${month}/${year}`);
            totalSkipped++;
            continue;
          }

          // Calculate payroll based on timesheets for this month
          const totalHours = monthTimesheets.reduce((sum, ts) => sum + Number(ts.hoursWorked), 0);
          const totalOvertimeHours = monthTimesheets.reduce((sum, ts) => sum + Number(ts.overtimeHours), 0);

          // Calculate overtime amount based on employee's overtime settings
          let overtimeAmount = 0;
          if (totalOvertimeHours > 0) {
            // Use the formula: basic/30/8*overtime rate
            const basicSalary = Number(employee.basicSalary);
            const hourlyRate = basicSalary / 30 / 8; // basic/30/8

            console.log(`Overtime calculation for ${employee.firstName} ${employee.lastName}:`);
            console.log(`- Total overtime hours: ${totalOvertimeHours}`);
            console.log(`- Basic salary: ${basicSalary}`);
            console.log(`- Hourly rate (basic/30/8): ${hourlyRate}`);
            console.log(`- Overtime fixed rate: ${employee.overtimeFixedRate}`);
            console.log(`- Overtime rate multiplier: ${employee.overtimeRateMultiplier}`);

            // Use employee's overtime settings
            if (employee.overtimeFixedRate && Number(employee.overtimeFixedRate) > 0) {
              // Use fixed overtime rate
              overtimeAmount = totalOvertimeHours * Number(employee.overtimeFixedRate);
              console.log(`- Using fixed rate: ${employee.overtimeFixedRate} SAR/hr`);
            } else {
              // Use overtime multiplier with basic/30/8 formula
              const overtimeMultiplier = Number(employee.overtimeRateMultiplier) || 1.5;
              overtimeAmount = totalOvertimeHours * (hourlyRate * overtimeMultiplier);
              console.log(`- Using multiplier: ${overtimeMultiplier}x (basic/30/8 formula)`);
            }
            
            console.log(`- Final overtime amount: ${overtimeAmount}`);
          }
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
              baseSalary: employee.basicSalary?.toString() || '0',
              overtimeAmount: overtimeAmount.toString(),
              bonusAmount: bonusAmount.toString(),
              deductionAmount: deductionAmount.toString(),
              advanceDeduction: '0',
              finalAmount: finalAmount.toString(),
              totalWorkedHours: totalHours.toString(),
              overtimeHours: totalOvertimeHours.toString(),
              status: 'pending',
              notes: `Generated from approved timesheets for ${month}/${year}`,
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

          // Add overtime item if there are overtime hours
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
          processedEmployees.push(`${employee.firstName} ${employee.lastName} (${month}/${year})`);
          generatedPayrolls.push(payroll.id.toString());
          totalGenerated++;
        }

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
        batchId: `BATCH_APPROVED_${Date.now()}`,
        runDate: new Date().toISOString(),
        status: 'pending',
        runBy: 1, // Default user ID
        totalEmployees: processedEmployees.length,
        notes: `Payroll generation for employees with approved timesheets - Generated: ${totalGenerated}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    const payrollRun = insertedPayrollRuns[0];

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
  }
}
