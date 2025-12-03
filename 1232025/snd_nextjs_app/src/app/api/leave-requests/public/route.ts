import { db } from '@/lib/drizzle';
import { employeeLeaves, employees } from '@/lib/drizzle/schema';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/leave-requests/public - Get leave requests for management (no auth required)
export async function GET(_request: NextRequest) {
  try {

    const { searchParams } = new URL(_request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('status') || '';
    const leaveType = searchParams.get('leaveType') || '';
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

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
      const searchPattern = `%${search}%`;
      whereConditions.push(
        or(
          ilike(employees.firstName, searchPattern),
          ilike(employees.middleName, searchPattern),
          ilike(employees.lastName, searchPattern),
          ilike(employees.fileNumber, searchPattern),
          ilike(employeeLeaves.reason, searchPattern),
          ilike(employeeLeaves.leaveType, searchPattern)
        )
      );
    }

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
        returnDate: employeeLeaves.returnDate,
        returnReason: employeeLeaves.returnReason,
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

    // Transform the data for the frontend
    const formattedLeaves = leaves.map(leave => ({
      id: leave.id,
      leave_type: leave.leaveType,
      start_date: leave.startDate.split('T')[0],
      end_date: leave.endDate.split('T')[0],
      days: leave.days,
      status: leave.status,
      reason: leave.reason,
      return_date: leave.returnDate ? leave.returnDate.split('T')[0] : null,
      return_reason: leave.returnReason,
      employee: {
        id: leave.employee?.id || 0,
        name: leave.employee
          ? `${leave.employee.firstName} ${leave.employee.lastName}`
          : 'Unknown Employee',
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

    return NextResponse.json(response);
  } catch (error) {

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
