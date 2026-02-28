/**
 * Generate payroll for a specific month from ALL timesheets (regardless of approval status).
 * Use when timesheet data comes from bulk-submit, Google Sheets, or other sources
 * that may not go through the approval workflow.
 */
import { db } from '@/lib/drizzle';
import { employees, payrollItems, payrollRuns, payrolls, timesheets } from '@/lib/drizzle/schema';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const url = new URL(request.url);
    const month = parseInt(body.month || url.searchParams.get('month') || '0');
    const year = parseInt(body.year || url.searchParams.get('year') || '0');

    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, message: 'Valid month (1-12) and year are required' },
        { status: 400 }
      );
    }

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    const monthStartStr = monthStart.toISOString().split('T')[0];
    const monthEndStr = monthEnd.toISOString().split('T')[0];

    // Get employees with timesheets for this month (ANY status - pending, approved, etc.)
    const timesheetsInMonth = await db
      .select({
        employeeId: timesheets.employeeId,
        date: timesheets.date,
        hoursWorked: timesheets.hoursWorked,
        overtimeHours: timesheets.overtimeHours,
      })
      .from(timesheets)
      .where(
        and(
          gte(timesheets.date, monthStartStr),
          lte(timesheets.date, monthEndStr)
        )
      );

    if (timesheetsInMonth.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No timesheet data found for ${month}/${year}. Add timesheets via bulk-submit or timesheet management first.`,
        data: { total_generated: 0, total_skipped: 0, total_errors: 0 },
      });
    }

    // Group by employee
    const employeeIds = [...new Set(timesheetsInMonth.map((t) => t.employeeId))];
    const timesheetsByEmployee = new Map<number, typeof timesheetsInMonth>();
    timesheetsInMonth.forEach((ts) => {
      if (!timesheetsByEmployee.has(ts.employeeId)) {
        timesheetsByEmployee.set(ts.employeeId, []);
      }
      timesheetsByEmployee.get(ts.employeeId)!.push(ts);
    });

    const processedEmployees: string[] = [];
    const generatedPayrolls: string[] = [];
    const errors: string[] = [];
    let totalGenerated = 0;
    let totalSkipped = 0;

    for (const employeeId of employeeIds) {
      const monthTimesheets = timesheetsByEmployee.get(employeeId)!;
      if (!monthTimesheets?.length) continue;

      try {
        const [employee] = await db
          .select({
            id: employees.id,
            firstName: employees.firstName,
            lastName: employees.lastName,
            basicSalary: employees.basicSalary,
            contractDaysPerMonth: employees.contractDaysPerMonth,
            contractHoursPerDay: employees.contractHoursPerDay,
            overtimeRateMultiplier: employees.overtimeRateMultiplier,
            overtimeFixedRate: employees.overtimeFixedRate,
            foodAllowance: employees.foodAllowance,
            housingAllowance: employees.housingAllowance,
            transportAllowance: employees.transportAllowance,
          })
          .from(employees)
          .where(eq(employees.id, employeeId))
          .limit(1);

        if (!employee) {
          errors.push(`Employee ${employeeId} not found`);
          continue;
        }

        // Check if payroll already exists
        const existingPayroll = await db
          .select({ id: payrolls.id })
          .from(payrolls)
          .where(
            and(
              eq(payrolls.employeeId, employeeId),
              eq(payrolls.month, month),
              eq(payrolls.year, year)
            )
          )
          .limit(1);

        if (existingPayroll.length > 0) {
          totalSkipped++;
          continue;
        }

        const daysInMonth = new Date(year, month, 0).getDate();
        const totalHours = monthTimesheets.reduce((sum, ts) => sum + Number(ts.hoursWorked), 0);
        const totalOvertimeHours = monthTimesheets.reduce(
          (sum, ts) => sum + Number(ts.overtimeHours),
          0
        );

        const timesheetMap = new Map<string, (typeof monthTimesheets)[0]>();
        monthTimesheets.forEach((ts) => {
          const dateKey = String(ts.date).split('T')[0];
          timesheetMap.set(dateKey, ts);
        });

        let absentDays = 0;
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month - 1, day);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          const isFriday = dayName === 'Fri';
          const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayData = timesheetMap.get(dateString);
          const hasHoursWorked =
            dayData && (Number(dayData.hoursWorked) > 0 || Number(dayData.overtimeHours) > 0);

          if (isFriday) {
            if (!hasHoursWorked) {
              const thursdayDate = new Date(year, month - 1, day - 1);
              const saturdayDate = new Date(year, month - 1, day + 1);
              const thursdayString = `${year}-${String(month).padStart(2, '0')}-${String(thursdayDate.getDate()).padStart(2, '0')}`;
              const saturdayString = `${year}-${String(month).padStart(2, '0')}-${String(saturdayDate.getDate()).padStart(2, '0')}`;
              const thursdayAbsent =
                !timesheetMap.get(thursdayString) ||
                (Number(timesheetMap.get(thursdayString)?.hoursWorked) === 0 &&
                  Number(timesheetMap.get(thursdayString)?.overtimeHours) === 0);
              const saturdayAbsent =
                !timesheetMap.get(saturdayString) ||
                (Number(timesheetMap.get(saturdayString)?.hoursWorked) === 0 &&
                  Number(timesheetMap.get(saturdayString)?.overtimeHours) === 0);
              if (thursdayAbsent && saturdayAbsent) absentDays++;
            }
          } else {
            if (!hasHoursWorked) absentDays++;
          }
        }

        const basicSalary = Number(employee.basicSalary) || 0;
        const contractHoursPerDay = Number(employee.contractHoursPerDay) || 8;
        const hourlyRate = basicSalary / (daysInMonth * contractHoursPerDay);

        let overtimeAmount = 0;
        if (totalOvertimeHours > 0) {
          const overtimeMultiplier = Number(employee.overtimeRateMultiplier) || 1.5;
          if (
            overtimeMultiplier === 0 &&
            employee.overtimeFixedRate &&
            Number(employee.overtimeFixedRate) > 0
          ) {
            overtimeAmount = totalOvertimeHours * Number(employee.overtimeFixedRate);
          } else {
            overtimeAmount = totalOvertimeHours * (hourlyRate * overtimeMultiplier);
          }
        }

        const absentDeduction =
          absentDays > 0 ? (basicSalary / daysInMonth) * absentDays : 0;
        const daysWorked = monthTimesheets.filter((ts) => Number(ts.hoursWorked) > 0).length;
        let shortHoursDeduction = 0;
        if (totalHours < daysWorked * contractHoursPerDay) {
          const expectedHours = daysWorked * contractHoursPerDay;
          shortHoursDeduction = (expectedHours - totalHours) * hourlyRate;
        }

        const bonusAmount = 0;
        const deductionAmount = absentDeduction + shortHoursDeduction;
        const totalAllowances =
          (Number(employee.foodAllowance) || 0) +
          (Number(employee.housingAllowance) || 0) +
          (Number(employee.transportAllowance) || 0);
        const finalAmount =
          basicSalary + totalAllowances + overtimeAmount + bonusAmount - deductionAmount;

        const today = new Date().toISOString().split('T')[0];
        const insertedPayrolls = await db
          .insert(payrolls)
          .values({
            employeeId: employee.id,
            month,
            year,
            baseSalary: employee.basicSalary?.toString() || '0',
            overtimeAmount: overtimeAmount.toString(),
            bonusAmount: bonusAmount.toString(),
            deductionAmount: deductionAmount.toString(),
            advanceDeduction: '0',
            finalAmount: finalAmount.toString(),
            totalWorkedHours: totalHours.toString(),
            overtimeHours: totalOvertimeHours.toString(),
            status: 'paid',
            notes: `Generated from timesheets for ${month}/${year} (includes bulk-submit/Google Sheets data)`,
            paidAt: today,
            paymentMethod: 'bank_transfer',
            paymentReference: `GEN-${month}-${year}-${employee.id}`,
            paymentStatus: 'completed',
            paymentProcessedAt: today,
            currency: 'SAR',
            createdAt: today,
            updatedAt: today,
          })
          .returning();

        const payroll = insertedPayrolls[0];
        if (!payroll) throw new Error('Failed to create payroll record');

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

        if (totalOvertimeHours > 0) {
          const overtimeMultiplier = Number(employee.overtimeRateMultiplier) || 1.5;
          const overtimeDescription =
            overtimeMultiplier === 0 && employee.overtimeFixedRate
              ? `Overtime Pay (Fixed Rate: ${employee.overtimeFixedRate} SAR/hr)`
              : `Overtime Pay (${overtimeMultiplier}x Rate)`;
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
      } catch (error) {
        errors.push(
          `Employee ${employeeId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    const payrollRun = await db
      .insert(payrollRuns)
      .values({
        batchId: `BATCH_MONTH_${year}_${month}_${Date.now()}`,
        runDate: new Date().toISOString(),
        status: 'pending',
        runBy: 1,
        totalEmployees: processedEmployees.length,
        notes: `Manual month generation for ${month}/${year} - Generated: ${totalGenerated}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    let message =
      `Payroll generation for ${month}/${year} completed.\n` +
      `Generated: ${totalGenerated}\n` +
      `Skipped (already exist): ${totalSkipped}\n` +
      `Errors: ${errors.length}`;

    if (processedEmployees.length > 0) {
      message += `\n\nProcessed: ${processedEmployees.join(', ')}`;
    }
    if (errors.length > 0) {
      message += `\n\nErrors: ${errors.slice(0, 5).join('; ')}`;
      if (errors.length > 5) message += ` and ${errors.length - 5} more...`;
    }

    return NextResponse.json({
      success: true,
      message,
      data: {
        total_generated: totalGenerated,
        total_skipped: totalSkipped,
        total_errors: errors.length,
        processed_employees: processedEmployees,
        errors,
      },
      payroll_run_id: payrollRun[0]?.id,
    });
  } catch (error) {
    console.error('Generate from month error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate payroll: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
