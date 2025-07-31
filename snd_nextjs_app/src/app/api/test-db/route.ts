import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Try a simple query
    const employeeCount = await prisma.employee.count();
    const timesheetCount = await prisma.timesheet.count();
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        employee_count: employeeCount,
        timesheet_count: timesheetCount,
        database_url: process.env.DATABASE_URL ? 'Set' : 'Not set'
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Database connection failed: ' + (error as Error).message,
        error: error
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 