import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { employeeLeaves, employees } from '@/lib/drizzle/schema';
import { eq, ilike, or, desc, sql, and } from 'drizzle-orm';

// GET /api/leave-requests/public - Get leave requests for management (no auth required)
export async function $1(_request: NextRequest) {
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

    // Build where conditions
    let whereConditions: any[] = [];
    
    if (status && status !== 'all') {
      whereConditions.push(eq(employeeLeaves.status, status));
    }

    if (leaveType && leaveType !== 'all') {
      whereConditions.push(eq(employeeLeaves.leaveType, leaveType));
    }

    // Add search functionality
    if (search) {
      whereConditions.push(
        or(
          ilike(employees.firstName, `%${search}%`),
          ilike(employees.lastName, `%${search}%`),
          ilike(employees.fileNumber, `%${search}%`),
          ilike(employeeLeaves.reason, `%${search}%`),
          ilike(employeeLeaves.leaveType, `%${search}%`)
        )
      );
    }

    console.log('🔍 Where conditions:', whereConditions);

    // Get leave requests with employee details
    const leaves = await db
      .select({
        id: employeeLeaves.id,
        leaveType: employeeLeaves.leaveType,
        startDate: employeeLeaves.startDate,
        endDate: employeeLeaves.endDate,
        days: employeeLeaves.days,
        status: employeeLeaves.status,
        reason: employeeLeaves.reason,
        createdAt: employeeLeaves.createdAt,
        updatedAt: employeeLeaves.updatedAt,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
        },
      })
      .from(employeeLeaves)
      .leftJoin(employees, eq(employeeLeaves.employeeId, employees.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(employeeLeaves.createdAt))
      .limit(limit)
      .offset(skip);

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(employeeLeaves)
      .leftJoin(employees, eq(employeeLeaves.employeeId, employees.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const total = totalResult[0]?.count || 0;

    console.log(`✅ Found ${leaves.length} leave requests out of ${total} total`);

    // Transform the data for the frontend
    const formattedLeaves = leaves.map(leave => ({
      id: leave.id,
      leave_type: leave.leaveType,
      start_date: leave.startDate.split('T')[0],
      end_date: leave.endDate.split('T')[0],
      days: leave.days,
      status: leave.status,
      reason: leave.reason,
      employee: {
        id: leave.employee?.id || 0,
        name: leave.employee ? `${leave.employee.firstName} ${leave.employee.lastName}` : 'Unknown Employee',
        employee_id: leave.employee?.fileNumber || 'Unknown',
      },
      created_at: leave.createdAt,
      updated_at: leave.updatedAt,
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
