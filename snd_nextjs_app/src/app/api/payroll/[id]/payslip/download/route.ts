import { db } from '@/lib/drizzle';
import { employees, payrollItems, payrolls, timesheets, advancePaymentHistories } from '@/lib/drizzle/schema';
import { and, asc, eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {

    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: 'Invalid payroll ID' }, { status: 400 });
    }

    // Get payroll with employee and items
    
    const payrollData = await db
      .select({
        id: payrolls.id,
        employeeId: payrolls.employeeId,
        month: payrolls.month,
        year: payrolls.year,
        baseSalary: payrolls.baseSalary,
        overtimeAmount: payrolls.overtimeAmount,
        bonusAmount: payrolls.bonusAmount,
        advanceDeduction: payrolls.advanceDeduction,
        finalAmount: payrolls.finalAmount,
        totalWorkedHours: payrolls.totalWorkedHours,
        overtimeHours: payrolls.overtimeHours,
        status: payrolls.status,
        notes: payrolls.notes,
        currency: payrolls.currency,
        createdAt: payrolls.createdAt,
        updatedAt: payrolls.updatedAt,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
          email: employees.email,
          phone: employees.phone,
          basicSalary: employees.basicSalary,
          foodAllowance: employees.foodAllowance,
          housingAllowance: employees.housingAllowance,
          transportAllowance: employees.transportAllowance,
          overtimeRateMultiplier: employees.overtimeRateMultiplier,
          overtimeFixedRate: employees.overtimeFixedRate,
          contractDaysPerMonth: employees.contractDaysPerMonth,
          contractHoursPerDay: employees.contractHoursPerDay,
        },
      })
      .from(payrolls)
      .leftJoin(employees, eq(payrolls.employeeId, employees.id))
      .where(eq(payrolls.id, id))
      .limit(1);

    if (!payrollData[0]) {
      
      return NextResponse.json(
        {
          success: false,
          message: 'Payroll not found',
        },
        { status: 404 }
      );
    }

    const payroll = payrollData[0];

    // Get payroll items
    const payrollItemsData = await db
      .select({
        id: payrollItems.id,
        type: payrollItems.type,
        description: payrollItems.description,
        amount: payrollItems.amount,
        isTaxable: payrollItems.isTaxable,
        taxRate: payrollItems.taxRate,
        order: payrollItems.order,
      })
      .from(payrollItems)
      .where(eq(payrollItems.payrollId, id))
      .orderBy(asc(payrollItems.order));

    // Calculate advance deduction from advance_payment_histories for this month/year
    let totalAdvanceDeduction = 0;
    if (payroll.employeeId && payroll.month && payroll.year) {
      // Create date range for the month (1st to last day of the month)
      const lastDayOfMonth = new Date(payroll.year, payroll.month, 0).getDate();
      const monthStart = `${payroll.year}-${payroll.month.toString().padStart(2, '0')}-01`;
      const monthEnd = `${payroll.year}-${payroll.month.toString().padStart(2, '0')}-${lastDayOfMonth.toString().padStart(2, '0')}`;
      
      const advanceHistories = await db
        .select({
          amount: advancePaymentHistories.amount,
        })
        .from(advancePaymentHistories)
        .where(
          and(
            eq(advancePaymentHistories.employeeId, payroll.employeeId),
            // Check if payment date is within the month
            sql`${advancePaymentHistories.paymentDate} >= ${monthStart}`,
            sql`${advancePaymentHistories.paymentDate} <= ${monthEnd}`
          )
        );

      // Sum up all advance payments for this month/year
      totalAdvanceDeduction = advanceHistories.reduce((total, history) => {
        return total + (history.amount ? Number(history.amount) : 0);
      }, 0);
    }

    // Get attendance data for the payroll month

    // Use month-based filtering to avoid timezone issues
    const attendanceData = await db
      .select({
        date: timesheets.date,
        hoursWorked: timesheets.hoursWorked,
        overtimeHours: timesheets.overtimeHours,
        status: timesheets.status,
      })
      .from(timesheets)
      .where(
        and(
          eq(timesheets.employeeId, payroll.employeeId),
          // Use raw SQL for month filtering to avoid timezone conversion
          sql`EXTRACT(YEAR FROM timesheets.date) = ${payroll.year}`,
          sql`EXTRACT(MONTH FROM timesheets.date) = ${payroll.month}`
        )
      )
      .orderBy(asc(timesheets.date));

    const attendanceDataMapped = attendanceData.map(a => ({
      date: a.date,
      dateStr: a.date ? String(a.date).split('T')[0] : '',
      day: a.date ? new Date(String(a.date).split('T')[0] || '').getDate() : 0,
      hours: a.hoursWorked,
      overtime: a.overtimeHours,
      status: a.status,
    }));

    // Transform attendance data
    const transformedAttendanceData = attendanceData.map(attendance => ({
      // Use the date directly without timezone conversion to avoid -1 day issue
      date: attendance.date ? String(attendance.date).split('T')[0] : '',
      day: attendance.date ? new Date(String(attendance.date).split('T')[0] || '').getDate() : 0,
      status: attendance.status,
      hours: Number(attendance.hoursWorked) || 0,
      overtime: Number(attendance.overtimeHours) || 0,
    }));

    // Transform payroll data
    const baseSalary = Number(payroll.baseSalary);
    const overtimeAmount = Number(payroll.overtimeAmount);
    const bonusAmount = Number(payroll.bonusAmount);
    const finalAmount = baseSalary + overtimeAmount + bonusAmount - totalAdvanceDeduction;
    
    const transformedPayroll = {
      ...payroll,
      base_salary: baseSalary,
      overtime_amount: overtimeAmount,
      bonus_amount: bonusAmount,
      deduction_amount: 0, // Removed all deductions except advance
      advance_deduction: totalAdvanceDeduction, // Auto-calculated from advance_payment_histories
      final_amount: finalAmount,
      total_worked_hours: Number(payroll.totalWorkedHours),
      overtime_hours: Number(payroll.overtimeHours),
      items: payrollItemsData,
    };

    // Transform employee data
    const transformedEmployee = {
      ...payroll.employee,
      basic_salary: Number(payroll.employee?.basicSalary || 0),
      food_allowance: Number(payroll.employee?.foodAllowance || 0),
      housing_allowance: Number(payroll.employee?.housingAllowance || 0),
      transport_allowance: Number(payroll.employee?.transportAllowance || 0),
      overtime_rate_multiplier: Number(payroll.employee?.overtimeRateMultiplier || 1.5),
              overtime_fixed_rate: Number(payroll.employee?.overtimeFixedRate || 6),
        contract_days_per_month: Number(payroll.employee?.contractDaysPerMonth || 30),
      contract_hours_per_day: Number(payroll.employee?.contractHoursPerDay || 8),
    };

    // Company data
    const company = {
      name: 'Samhan Naser Al-Dosri Est.',
      address: 'For Gen. Contracting & Rent. Equipments',
      phone: '+966501234567',
      email: 'info@snd.com',
      website: 'www.snd.com',
    };

    // For now, return JSON data with instructions to generate PDF on frontend
    // In a real implementation, you would generate PDF here using a library like puppeteer or jsPDF
    
    return NextResponse.json({
      success: true,
      data: {
        payroll: transformedPayroll,
        employee: transformedEmployee,
        attendanceData: transformedAttendanceData,
        company,
      },
      message: 'Use frontend PDF generation',
    });
  } catch (error) {
    // Swallow detailed error logs in production

    return NextResponse.json(
      {
        success: false,
        message: 'Error generating payslip PDF: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
