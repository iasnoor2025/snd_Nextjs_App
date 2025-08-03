import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 PAYSLIP API - Starting request');
    
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    console.log('🔍 PAYSLIP API - Payroll ID:', id);

    // Connect to database
    console.log('🔍 PAYSLIP API - Connecting to database...');
    await prisma.$connect();
    console.log('🔍 PAYSLIP API - Database connected');

    // Get payroll with employee and items
    console.log('🔍 PAYSLIP API - Fetching payroll data...');
    const payroll = await prisma.payroll.findUnique({
      where: { id: id },
      include: {
        employee: true,
        items: {
          orderBy: { order: 'asc' }
        }
      }
    });

    console.log('🔍 PAYSLIP API - Payroll found:', !!payroll);

    if (!payroll) {
      console.log('🔍 PAYSLIP API - Payroll not found for ID:', id);
      return NextResponse.json(
        {
          success: false,
          message: 'Payroll not found'
        },
        { status: 404 }
      );
    }

    // Get attendance data for the payroll month
    console.log('🔍 PAYSLIP API - Fetching attendance data...');
    const startDate = new Date(payroll.year, payroll.month - 1, 1);
    const endDate = new Date(payroll.year, payroll.month, 0);
    
    console.log('🔍 PAYSLIP API - Date range:', { startDate, endDate, employeeId: payroll.employee_id });

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
    
    console.log('🔍 PAYSLIP API - Attendance records found:', attendanceData.length);

    // Transform attendance data - Convert Decimal to numbers
    const transformedAttendanceData = attendanceData.map(attendance => ({
      date: attendance.date.toISOString().split('T')[0],
      day: attendance.date.getDate(),
      status: attendance.status,
      hours: Number(attendance.hours_worked) || 0,
      overtime: Number(attendance.overtime_hours) || 0
    }));

    // Mock company data (you can replace this with actual company data from your database)
    const company = {
      name: "Samhan Naser Al-Dosri Est.",
      address: "For Gen. Contracting & Rent. Equipments",
      phone: "+966501234567",
      email: "info@snd.com",
      website: "www.snd.com"
    };

    // Transform payroll data to convert Decimal to numbers
    const transformedPayroll = {
      ...payroll,
      base_salary: Number(payroll.base_salary),
      overtime_amount: Number(payroll.overtime_amount),
      bonus_amount: Number(payroll.bonus_amount),
      deduction_amount: Number(payroll.deduction_amount),
      advance_deduction: Number(payroll.advance_deduction),
      final_amount: Number(payroll.final_amount),
      total_worked_hours: Number(payroll.total_worked_hours),
      overtime_hours: Number(payroll.overtime_hours)
    };

    // Transform employee data to convert Decimal to numbers
    const transformedEmployee = {
      ...payroll.employee,
      basic_salary: Number(payroll.employee.basic_salary || 0),
      food_allowance: Number(payroll.employee.food_allowance || 0),
      housing_allowance: Number(payroll.employee.housing_allowance || 0),
      transport_allowance: Number(payroll.employee.transport_allowance || 0),
      advance_payment: Number(payroll.employee.advance_payment || 0)
    };

    // Return JSON data for the frontend
    console.log('🔍 PAYSLIP API - Returning response');
    return NextResponse.json({
      success: true,
      data: {
        payroll: transformedPayroll,
        employee: transformedEmployee,
        attendanceData: transformedAttendanceData,
        company
      }
    });

  } catch (error) {
    console.error('🔍 PAYSLIP API - Error:', error);
    console.error('🔍 PAYSLIP API - Error message:', (error as Error).message);
    console.error('🔍 PAYSLIP API - Error stack:', (error as Error).stack);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Error fetching payslip data: ' + (error as Error).message
      },
      { status: 500 }
    );
  } finally {
    console.log('🔍 PAYSLIP API - Disconnecting from database');
    await prisma.$disconnect();
  }
}


