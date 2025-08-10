import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { payrolls, employees, payrollItems, timesheets } from '@/lib/drizzle/schema';
import { eq, and, gte, lte, asc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 PAYSLIP DOWNLOAD API - Starting request');
    
    const { id: idParam } = params;
    const id = parseInt(idParam);
    
    console.log('🔍 PAYSLIP DOWNLOAD API - Payroll ID:', id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid payroll ID' },
        { status: 400 }
      );
    }

    // Get payroll with employee and items
    console.log('🔍 PAYSLIP DOWNLOAD API - Fetching payroll data...');
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
        }
      })
      .from(payrolls)
      .leftJoin(employees, eq(payrolls.employeeId, employees.id))
      .where(eq(payrolls.id, id))
      .limit(1);

    console.log('🔍 PAYSLIP DOWNLOAD API - Payroll found:', !!payrollData[0]);

    if (!payrollData[0]) {
      console.log('🔍 PAYSLIP DOWNLOAD API - Payroll not found for ID:', id);
      return NextResponse.json(
        {
          success: false,
          message: 'Payroll not found'
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

    // Get attendance data for the payroll month
    console.log('🔍 PAYSLIP DOWNLOAD API - Fetching attendance data...');
    const startDate = new Date(`${payroll.year}-${String(payroll.month).padStart(2, '0')}-01T00:00:00.000Z`);
    const endDate = new Date(`${payroll.year}-${String(payroll.month).padStart(2, '0')}-${new Date(payroll.year, payroll.month, 0).getDate()}T23:59:59.999Z`);
    
    console.log('🔍 PAYSLIP DOWNLOAD API - Date range:', { 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString(), 
      employeeId: payroll.employeeId,
      payrollMonth: payroll.month,
      payrollYear: payroll.year
    });

    const attendanceData = await db
      .select({
        id: timesheets.id,
        date: timesheets.date,
        status: timesheets.status,
        hoursWorked: timesheets.hoursWorked,
        overtimeHours: timesheets.overtimeHours,
      })
      .from(timesheets)
      .where(
        and(
          eq(timesheets.employeeId, payroll.employeeId),
          gte(timesheets.date, startDate),
          lte(timesheets.date, endDate)
        )
      )
      .orderBy(asc(timesheets.date));
    
    console.log('🔍 PAYSLIP DOWNLOAD API - Attendance records found:', attendanceData.length);

    // Transform attendance data
    const transformedAttendanceData = attendanceData.map(attendance => ({
      date: attendance.date.toISOString().split('T')[0],
      day: attendance.date.getDate(),
      status: attendance.status,
      hours: Number(attendance.hoursWorked) || 0,
      overtime: Number(attendance.overtimeHours) || 0
    }));

    // Transform payroll data
    const transformedPayroll = {
      ...payroll,
      base_salary: Number(payroll.baseSalary),
      overtime_amount: Number(payroll.overtimeAmount),
      bonus_amount: Number(payroll.bonusAmount),
      advance_deduction: Number(payroll.advanceDeduction),
      final_amount: Number(payroll.finalAmount),
      total_worked_hours: Number(payroll.totalWorkedHours),
      overtime_hours: Number(payroll.overtimeHours),
      items: payrollItemsData
    };

    // Transform employee data
    const transformedEmployee = {
      ...payroll.employee,
      basic_salary: Number(payroll.employee.basicSalary || 0),
      food_allowance: Number(payroll.employee.foodAllowance || 0),
      housing_allowance: Number(payroll.employee.housingAllowance || 0),
      transport_allowance: Number(payroll.employee.transportAllowance || 0),
      overtime_rate_multiplier: Number(payroll.employee.overtimeRateMultiplier || 1.5),
      overtime_fixed_rate: Number(payroll.employee.overtimeFixedRate || 0),
      contract_days_per_month: Number(payroll.employee.contractDaysPerMonth || 26),
      contract_hours_per_day: Number(payroll.employee.contractHoursPerDay || 8)
    };

    // Company data
    const company = {
      name: "Samhan Naser Al-Dosri Est.",
      address: "For Gen. Contracting & Rent. Equipments",
      phone: "+966501234567",
      email: "info@snd.com",
      website: "www.snd.com"
    };

    // For now, return JSON data with instructions to generate PDF on frontend
    // In a real implementation, you would generate PDF here using a library like puppeteer or jsPDF
    console.log('🔍 PAYSLIP DOWNLOAD API - Returning data for frontend PDF generation');
    return NextResponse.json({
      success: true,
      data: {
        payroll: transformedPayroll,
        employee: transformedEmployee,
        attendanceData: transformedAttendanceData,
        company
      },
      message: 'Use frontend PDF generation'
    });

  } catch (error) {
    console.error('🔍 PAYSLIP DOWNLOAD API - Error:', error);
    console.error('🔍 PAYSLIP DOWNLOAD API - Error message:', (error as Error).message);
    console.error('🔍 PAYSLIP DOWNLOAD API - Error stack:', (error as Error).stack);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Error generating payslip PDF: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
} 