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

    // Transform attendance data
    const transformedAttendanceData = attendanceData.map(attendance => ({
      date: attendance.date.toISOString().split('T')[0],
      day: attendance.date.getDate(),
      status: attendance.status,
      hours: attendance.hours_worked || 0,
      overtime: attendance.overtime_hours || 0
    }));

    // Mock company data (you can replace this with actual company data from your database)
    const company = {
      name: "Your Company Name",
      address: "Company Address",
      phone: "+1234567890",
      email: "info@company.com",
      website: "www.company.com"
    };

    // Return JSON data for the frontend
    console.log('🔍 PAYSLIP API - Returning response');
    return NextResponse.json({
      success: true,
      data: {
        payroll,
        employee: payroll.employee,
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


