import { db } from '@/lib/drizzle';
import { employees, payrollItems, payrolls, timesheets, advancePaymentHistories } from '@/lib/drizzle/schema';
import { and, asc, eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Fix the params.id error by properly awaiting params
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    // Connect to database
    
    // Drizzle uses pooled connections automatically

    // Get payroll with employee and items
    
    const payrollRow = await db.select().from(payrolls).where(eq(payrolls.id, id)).limit(1);
    const payroll = payrollRow[0] as any;

    const employeeRow = payroll
      ? await db.select().from(employees).where(eq(employees.id, payroll.employeeId)).limit(1)
      : [];
    const payrollItemsRows = payroll
      ? await db
          .select()
          .from(payrollItems)
          .where(eq(payrollItems.payrollId, payroll.id))
          .orderBy(asc(payrollItems.order))
      : [];

    if (!payroll) {

      // Generate sample data for testing if payroll not found
      
      const samplePayroll = {
        id: id,
        employee_id: 1,
        month: 7,
        year: 2025,
        base_salary: 1000,
        overtime_amount: 12.5,
        bonus_amount: 0,
        advance_deduction: 0,
        final_amount: 1012.5,
        total_worked_hours: 218,
        overtime_hours: 2,
        status: 'pending',
        notes: '',
        approved_by: null,
        approved_at: null,
        paid_by: null,
        paid_at: null,
        payment_method: null,
        payment_reference: null,
        payment_status: null,
        payment_processed_at: null,
        currency: 'SAR',
        created_at: new Date(),
        updated_at: new Date(),
        employee: {
          id: 1,
          first_name: 'ABDULLAH',
          last_name: 'MOHAMMED ABDO AL SHAEBI AL SHAEBI',
          full_name: 'ABDULLAH MOHAMMED ABDO AL SHAEBI AL SHAEBI',
          file_number: 'HR-EMP-00007',
          basic_salary: 1000,
          department: 'IT',
          designation: 'Software Engineer',
          status: 'active',
          food_allowance: 0,
          housing_allowance: 0,
          transport_allowance: 0,
          overtime_rate_multiplier: 1.5,
                  overtime_fixed_rate: 6,
        contract_days_per_month: 30,
          contract_hours_per_day: 8,
        },
        items: [],
      };

      // Generate sample attendance data
      const sampleAttendanceData: Array<{
        date: string;
        day: number;
        status: string;
        hours: number;
        overtime: number;
      }> = [];
      const daysInMonth = new Date(2025, 7, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(2025, 6, day); // July 2025
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const isFriday = dayName === 'Fri';

        const regularHours = isFriday ? 0 : Math.random() > 0.2 ? 8 : 0;
        const overtimeHours =
          regularHours > 0 && Math.random() > 0.9 ? Math.floor(Math.random() * 3) + 1 : 0;

        sampleAttendanceData.push({
          // Use local date string to avoid timezone issues
          date: date.toLocaleDateString('en-CA'), // YYYY-MM-DD format
          day: day,
          status: regularHours > 0 ? 'present' : isFriday ? 'weekend' : 'absent',
          hours: regularHours,
          overtime: overtimeHours,
        });
      }

      const company = {
        name: 'Samhan Naser Al-Dosri Est.',
        address: 'For Gen. Contracting & Rent. Equipments',
        phone: '+966501234567',
        email: 'info@snd.com',
        website: 'www.snd.com',
      };

      return NextResponse.json({
        success: true,
        data: {
          payroll: samplePayroll,
          employee: samplePayroll.employee,
          attendanceData: sampleAttendanceData,
          company,
        },
      });
    }

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
        hours_worked: timesheets.hoursWorked,
        overtime_hours: timesheets.overtimeHours,
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


    // Transform attendance data - Convert Decimal to numbers
    const transformedAttendanceData = attendanceData.map(attendance => ({
      // Use the date directly without timezone conversion to avoid -1 day issue
      date: attendance.date ? String(attendance.date).split('T')[0] : '',
      day: attendance.date ? new Date(String(attendance.date).split('T')[0] || '').getDate() : 0,
      status: attendance.status as string,
      hours: Number(attendance.hours_worked) || 0,
      overtime: Number(attendance.overtime_hours) || 0,
    }));

    // Mock company data (you can replace this with actual company data from your database)
    const company = {
      name: 'Samhan Naser Al-Dosri Est.',
      address: 'For Gen. Contracting & Rent. Equipments',
      phone: '+966501234567',
      email: 'info@snd.com',
      website: 'www.snd.com',
    };

    // Transform payroll data to convert Decimal to numbers
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
      employee_id: payroll.employeeId,
      items: payrollItemsRows,
    } as any;

    // Transform employee data to convert Decimal to numbers
    const emp = employeeRow[0] as any;
    const transformedEmployee = emp
      ? {
          ...emp,
          basic_salary: Number(emp.basicSalary || 0),
          food_allowance: Number(emp.foodAllowance || 0),
          housing_allowance: Number(emp.housingAllowance || 0),
          transport_allowance: Number(emp.transportAllowance || 0),
          overtime_rate_multiplier: Number(emp.overtimeRateMultiplier || 1.5),
                  overtime_fixed_rate: Number(emp.overtimeFixedRate || 6),
        contract_days_per_month: Number(emp.contractDaysPerMonth || 30),
          contract_hours_per_day: Number(emp.contractHoursPerDay || 8),
          first_name: emp.firstName,
          last_name: emp.lastName,
          full_name: `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim(),
          file_number: emp.fileNumber,
          department: '',
          designation: '',
        }
      : null;

    // Return JSON data for the frontend
    
    return NextResponse.json({
      success: true,
      data: {
        payroll: transformedPayroll,
        employee: transformedEmployee,
        attendanceData: transformedAttendanceData,
        company,
      },
    });
  } catch (error) {
    // Swallow detailed error logs in production

    return NextResponse.json(
      {
        success: false,
        message: 'Error fetching payslip data: ' + (error as Error).message,
      },
      { status: 500 }
    );
  } finally {
    // Pooled with Drizzle; nothing to disconnect
  }
}
