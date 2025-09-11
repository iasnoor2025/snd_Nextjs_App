import { db } from '@/lib/drizzle';
import { employees, payrollItems, payrollRuns, payrolls, timesheets } from '@/lib/drizzle/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST() {
  try {

    // Test basic connection first
    try {
      // Test connection by running a simple query
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
          eq(employees.status, 'active')
          // We'll get timesheets separately to avoid complex joins
        )
      );

    const processedEmployees: string[] = [];
    const generatedPayrolls: string[] = [];
    const errors: string[] = [];
    let totalGenerated = 0;
    let totalSkipped = 0;

    // Process each employee
    for (const employee of employeesWithApprovedTimesheets) {
      try {

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
          
          continue;
        }

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

          if (!year || !month) {
            
            continue;
          }

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
            
            totalSkipped++;
            continue;
          }

          // Calculate payroll based on timesheets for this month
          const totalHours = monthTimesheets.reduce((sum, ts) => sum + Number(ts.hoursWorked), 0);
          const totalOvertimeHours = monthTimesheets.reduce(
            (sum, ts) => sum + Number(ts.overtimeHours),
            0
          );

          // Calculate absent days by checking ALL days in the month (including Fridays with smart logic)
          const daysInMonth = new Date(year, month, 0).getDate();
          let absentDays = 0;

          // Create a map of timesheet dates for easier lookup
          const timesheetMap = new Map();
          monthTimesheets.forEach(ts => {
            // Convert date to YYYY-MM-DD format - handle both Date objects and strings
            const dateKey = String(ts.date).split('T')[0];
            timesheetMap.set(dateKey, ts);

            // Debug: log the date type and value
            
          });

          // Loop through all days in the month
          for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const isFriday = dayName === 'Fri';

            // Create date string to check against timesheet data
            const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayData = timesheetMap.get(dateString);

            // Check if this day has hours worked
            const hasHoursWorked =
              dayData && (Number(dayData.hoursWorked) > 0 || Number(dayData.overtimeHours) > 0);

            if (isFriday) {
              // Special logic for Fridays
              if (hasHoursWorked) {
                // Friday has hours worked - count as present
                continue;
              } else {
                // Friday has no hours - check if it should be counted as absent
                const thursdayDate = new Date(year, month - 1, day - 1);
                const saturdayDate = new Date(year, month - 1, day + 1);

                // Check if Thursday and Saturday are also absent (within month bounds)
                const thursdayString = `${year}-${String(month).padStart(2, '0')}-${String(thursdayDate.getDate()).padStart(2, '0')}`;
                const saturdayString = `${year}-${String(month).padStart(2, '0')}-${String(saturdayDate.getDate()).padStart(2, '0')}`;

                const thursdayData = timesheetMap.get(thursdayString);
                const saturdayData = timesheetMap.get(saturdayString);

                const thursdayAbsent =
                  !thursdayData ||
                  (Number(thursdayData.hoursWorked) === 0 &&
                    Number(thursdayData.overtimeHours) === 0);
                const saturdayAbsent =
                  !saturdayData ||
                  (Number(saturdayData.hoursWorked) === 0 &&
                    Number(saturdayData.overtimeHours) === 0);

                // Count Friday as absent only if Thursday and Saturday are also absent
                if (thursdayAbsent && saturdayAbsent) {
                  absentDays++;
                }
              }
            } else {
              // Non-Friday days - consider absent if no hours worked
              if (!hasHoursWorked) {
                absentDays++;
              }
            }
          }

          // Calculate overtime amount based on employee's overtime settings
          let overtimeAmount = 0;
          if (totalOvertimeHours > 0) {
            // Use the formula: basic/(total_days_in_month * contract_hours)*overtime rate
            const basicSalary = Number(employee.basicSalary);
            const totalDaysInMonth = daysInMonth; // Use actual days in the month
            const contractHours = Number(employee.contractHoursPerDay) || 8;
            const hourlyRate = basicSalary / (totalDaysInMonth * contractHours);

            // Use employee's overtime settings
            // Check if multiplier is 0 (indicating fixed rate is being used)
            const overtimeMultiplier = Number(employee.overtimeRateMultiplier) || 1.5;
            if (overtimeMultiplier === 0 && employee.overtimeFixedRate && Number(employee.overtimeFixedRate) > 0) {
              // Use fixed overtime rate
              overtimeAmount = totalOvertimeHours * Number(employee.overtimeFixedRate);
              console.log(`Using fixed overtime rate: ${employee.overtimeFixedRate} SAR/hr`);
            } else {
              // Use overtime multiplier with calculated hourly rate
              overtimeAmount = totalOvertimeHours * (hourlyRate * overtimeMultiplier);
              console.log(`Using overtime multiplier: ${overtimeMultiplier}x basic rate`);
            }

          }

          // Calculate absent deduction: (Basic Salary / Total Days in Month) * Absent Days
          const basicSalary = Number(employee.basicSalary);
          const totalDaysInMonth = daysInMonth; // Use actual days in the month
          const absentDeduction = absentDays > 0 ? (basicSalary / totalDaysInMonth) * absentDays : 0;

          console.log(`Absent deduction calculation: (${basicSalary} / ${daysInMonth}) * ${absentDays} = ${absentDeduction}`);

          // Calculate short hours deduction
          // Get employee's contract hours per day
          const contractHoursPerDay = Number(employee.contractHoursPerDay) || 8;
          
          // Calculate hourly rate for deductions
          const hourlyRate = basicSalary / (totalDaysInMonth * contractHoursPerDay);
          
          // Calculate days worked from timesheets (only count days with regular hours)
          const daysWorked = monthTimesheets.filter(ts => Number(ts.hoursWorked) > 0).length;
          
          // Calculate short hours deduction
          let shortHoursDeduction = 0;
          if (totalHours < (daysWorked * contractHoursPerDay)) {
            const expectedHours = daysWorked * contractHoursPerDay;
            const shortHours = expectedHours - totalHours;
            shortHoursDeduction = shortHours * hourlyRate;
            console.log(`Short hours deduction: ${shortHours} hours × ${hourlyRate} = ${shortHoursDeduction}`);
          }

          const bonusAmount = 0; // Manual setting only
          const deductionAmount = absentDeduction + shortHoursDeduction; // Include both absent and short hours deduction
          
          // Calculate total allowances
          const totalAllowances = 
            (Number(employee.foodAllowance) || 0) +
            (Number(employee.housingAllowance) || 0) +
            (Number(employee.transportAllowance) || 0);
          
          const finalAmount =
            Number(employee.basicSalary) + totalAllowances + overtimeAmount + bonusAmount - deductionAmount;

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

          if (!payroll) {
            throw new Error('Failed to create payroll record');
          }

          // Create payroll items
          const payrollItemsData = [
            {
              payrollId: payroll.id,
              type: 'earnings',
              description: 'Basic Salary',
              amount: employee.basicSalary?.toString() || '0',
              order: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ];

          // Add overtime item if there are overtime hours
          if (totalOvertimeHours > 0) {
            let overtimeDescription = 'Overtime Pay';
            const overtimeMultiplierForDescription = Number(employee.overtimeRateMultiplier) || 1.5;
            if (overtimeMultiplierForDescription === 0 && employee.overtimeFixedRate && Number(employee.overtimeFixedRate) > 0) {
              overtimeDescription = `Overtime Pay (Fixed Rate: ${employee.overtimeFixedRate} SAR/hr)`;
            } else {
              overtimeDescription = `Overtime Pay (${overtimeMultiplierForDescription}x Rate)`;
            }

            payrollItemsData.push({
              payrollId: payroll.id,
              type: 'overtime',
              description: overtimeDescription,
              amount: overtimeAmount.toString(),
              order: 2,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }

          await db.insert(payrollItems).values(payrollItemsData);

          processedEmployees.push(`${employee.firstName} ${employee.lastName} (${month}/${year})`);
          generatedPayrolls.push(payroll.id.toString());
          totalGenerated++;
        }
      } catch (error) {
        const errorMsg = `Error processing ${employee.firstName} ${employee.lastName}: ${error}`;
        console.error('Error processing employee:', errorMsg);
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

    if (!payrollRun) {
      throw new Error('Failed to create payroll run record');
    }

    let message =
      `Payroll generation completed successfully.\n` +
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
        errors: errors,
      },
      payroll_run_id: payrollRun.id,
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate payroll: ' + (error as Error).message,
        error: error,
      },
      { status: 500 }
    );
  }
}
