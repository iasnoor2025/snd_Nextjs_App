import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 PAYSLIP DOWNLOAD API - Starting request');
    
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    console.log('🔍 PAYSLIP DOWNLOAD API - Payroll ID:', id);

    // Connect to database
    console.log('🔍 PAYSLIP DOWNLOAD API - Connecting to database...');
    await prisma.$connect();
    console.log('🔍 PAYSLIP DOWNLOAD API - Database connected');

    // Get payroll with employee and items
    console.log('🔍 PAYSLIP DOWNLOAD API - Fetching payroll data...');
    const payroll = await prisma.payroll.findUnique({
      where: { id: id },
      include: {
        employee: true,
        items: {
          orderBy: { order: 'asc' }
        }
      }
    });

    console.log('🔍 PAYSLIP DOWNLOAD API - Payroll found:', !!payroll);

    if (!payroll) {
      console.log('🔍 PAYSLIP DOWNLOAD API - Payroll not found for ID:', id);
      return NextResponse.json(
        {
          success: false,
          message: 'Payroll not found'
        },
        { status: 404 }
      );
    }

    // Get attendance data for the payroll month
    console.log('🔍 PAYSLIP DOWNLOAD API - Fetching attendance data...');
    const startDate = new Date(`${payroll.year}-${String(payroll.month).padStart(2, '0')}-01T00:00:00.000Z`);
    const endDate = new Date(`${payroll.year}-${String(payroll.month).padStart(2, '0')}-${new Date(payroll.year, payroll.month, 0).getDate()}T23:59:59.999Z`);
    
    console.log('🔍 PAYSLIP DOWNLOAD API - Date range:', { 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString(), 
      employeeId: payroll.employee_id,
      payrollMonth: payroll.month,
      payrollYear: payroll.year
    });

    const attendanceData = await prisma.timesheet.findMany({
      where: {
        employee_id: payroll.employee_id,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        date: 'asc'
      }
    });
    
    console.log('🔍 PAYSLIP DOWNLOAD API - Attendance records found:', attendanceData.length);

    // Transform attendance data
    const transformedAttendanceData = attendanceData.map(attendance => ({
      date: attendance.date.toISOString().split('T')[0],
      day: attendance.date.getDate(),
      status: attendance.status,
      hours: Number(attendance.hours_worked) || 0,
      overtime: Number(attendance.overtime_hours) || 0
    }));

    // Transform payroll data
    const transformedPayroll = {
      ...payroll,
      base_salary: Number(payroll.base_salary),
      overtime_amount: Number(payroll.overtime_amount),
      bonus_amount: Number(payroll.bonus_amount),
      advance_deduction: Number(payroll.advance_deduction),
      final_amount: Number(payroll.final_amount),
      total_worked_hours: Number(payroll.total_worked_hours),
      overtime_hours: Number(payroll.overtime_hours)
    };

    // Transform employee data
    const transformedEmployee = {
      ...payroll.employee,
      basic_salary: Number(payroll.employee.basic_salary || 0),
      food_allowance: Number(payroll.employee.food_allowance || 0),
      housing_allowance: Number(payroll.employee.housing_allowance || 0),
      transport_allowance: Number(payroll.employee.transport_allowance || 0),
      overtime_rate_multiplier: Number(payroll.employee.overtime_rate_multiplier || 1.5),
      overtime_fixed_rate: Number(payroll.employee.overtime_fixed_rate || 0),
      contract_days_per_month: Number(payroll.employee.contract_days_per_month || 26),
      contract_hours_per_day: Number(payroll.employee.contract_hours_per_day || 8)
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
  } finally {
    console.log('🔍 PAYSLIP DOWNLOAD API - Disconnecting from database');
    await prisma.$disconnect();
  }
} 