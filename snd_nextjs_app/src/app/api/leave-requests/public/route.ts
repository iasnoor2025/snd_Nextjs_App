import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/leave-requests/public - Get leave requests for management (no auth required)
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting public leave requests fetch...');
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('status') || '';
    const leaveType = searchParams.get('leaveType') || '';
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    console.log('🔍 Public search params:', { limit, page, status, leaveType, search });

    // Build where clause
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }

    if (leaveType && leaveType !== 'all') {
      where.leave_type = leaveType;
    }

    // Add search functionality
    if (search) {
      where.OR = [
        {
          employee: {
            OR: [
              { first_name: { contains: search, mode: 'insensitive' } },
              { last_name: { contains: search, mode: 'insensitive' } },
              { employee_id: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
        { reason: { contains: search, mode: 'insensitive' } },
        { leave_type: { contains: search, mode: 'insensitive' } },
      ];
    }

    console.log('🔍 Where clause:', JSON.stringify(where, null, 2));

    // Get leave requests with employee details
    const [leaves, total] = await Promise.all([
      prisma.employeeLeave.findMany({
        where,
        take: limit,
        skip,
        orderBy: {
          created_at: 'desc',
        },
        include: {
          employee: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              employee_id: true,
            },
          },
        },
      }),
      prisma.employeeLeave.count({ where }),
    ]);

    console.log(`✅ Found ${leaves.length} leave requests out of ${total} total`);

    // Transform the data for the frontend
    const formattedLeaves = leaves.map(leave => ({
      id: leave.id,
      leave_type: leave.leave_type,
      start_date: leave.start_date.toISOString().split('T')[0],
      end_date: leave.end_date.toISOString().split('T')[0],
      days: leave.days,
      status: leave.status,
      reason: leave.reason,
      employee: {
        id: leave.employee.id,
        name: `${leave.employee.first_name} ${leave.employee.last_name}`,
        employee_id: leave.employee.employee_id,
      },
      created_at: leave.created_at.toISOString(),
      updated_at: leave.updated_at.toISOString(),
    }));

    const response = {
      success: true,
      leaves: formattedLeaves,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };

    console.log('✅ Returning response with', formattedLeaves.length, 'leave requests');
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Error fetching leave requests:', error);
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
