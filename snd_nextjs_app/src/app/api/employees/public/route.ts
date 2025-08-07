import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/employees/public - Get employees for dropdown (no auth required)
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting public employee fetch...');
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '1000');
    const search = searchParams.get('search') || '';
    const all = searchParams.get('all') === 'true';

    console.log('🔍 Public search params:', { limit, search, all });

    // Build where clause
    const where: any = {
      status: 'active', // Only show active employees
    };
    
    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { employee_id: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    console.log('🔍 Where clause:', JSON.stringify(where, null, 2));

    // Get employees
    console.log('🔍 Executing employee query...');
    const employees = await prisma.employee.findMany({
      where,
      take: all ? undefined : limit,
      orderBy: { first_name: 'asc' },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        employee_id: true,
        file_number: true,
        email: true,
        phone: true,
        department: {
          select: {
            name: true,
          },
        },
        designation: {
          select: {
            name: true,
          },
        },
        status: true,
      },
    });

    console.log(`✅ Found ${employees.length} employees`);

    // Transform the data for the dropdown
    const transformedEmployees = employees.map(employee => ({
      id: employee.id.toString(),
      first_name: employee.first_name,
      last_name: employee.last_name,
      employee_id: employee.employee_id,
      file_number: employee.file_number,
      email: employee.email,
      phone: employee.phone,
      department: employee.department?.name,
      designation: employee.designation?.name,
      status: employee.status,
    }));

    const response = {
      success: true,
      data: transformedEmployees,
      total: transformedEmployees.length,
    };

    console.log('✅ Returning response with', transformedEmployees.length, 'employees');
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Error fetching employees:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
