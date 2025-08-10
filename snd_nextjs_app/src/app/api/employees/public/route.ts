import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { employees as employeesTable, departments, designations } from '@/lib/drizzle/schema';
import { and, asc, eq, ilike, or } from 'drizzle-orm';

// GET /api/employees/public - Get employees for dropdown (no auth required)
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting public employee fetch...');

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '1000');
    const search = searchParams.get('search') || '';
    const all = searchParams.get('all') === 'true';

    console.log('🔍 Public search params:', { limit, search, all });

    // Build filters
    const filters: any[] = [eq(employeesTable.status, 'active')];
    if (search) {
      const s = `%${search}%`;
      filters.push(
        or(
          ilike(employeesTable.firstName, s),
          ilike(employeesTable.lastName, s),
          ilike(employeesTable.fileNumber, s),
          ilike(employeesTable.email as any, s),
        )
      );
    }

    console.log('🔍 Executing employee query...');
    const baseQuery = db
      .select({
        id: employeesTable.id,
        first_name: employeesTable.firstName,
        last_name: employeesTable.lastName,
        employee_id: employeesTable.id,
        file_number: employeesTable.fileNumber,
        email: employeesTable.email,
        phone: employeesTable.phone,
        dept_name: departments.name,
        desig_name: designations.name,
        status: employeesTable.status,
      })
      .from(employeesTable)
      .leftJoin(departments, eq(departments.id, employeesTable.departmentId))
      .leftJoin(designations, eq(designations.id, employeesTable.designationId))
      .where(and(...filters))
      .orderBy(asc(employeesTable.firstName));

    const rows = await (all ? baseQuery : baseQuery.limit(limit));

    console.log(`✅ Found ${rows.length} employees`);

    const transformedEmployees = rows.map((employee) => ({
      id: String(employee.id),
      first_name: employee.first_name,
      last_name: employee.last_name,
      employee_id: employee.employee_id,
      file_number: employee.file_number,
      email: employee.email,
      phone: employee.phone,
      department: employee.dept_name || null,
      designation: employee.desig_name || null,
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
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
