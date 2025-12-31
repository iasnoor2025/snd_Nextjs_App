import { db } from '@/lib/db';
import { departments, designations, employees as employeesTable } from '@/lib/drizzle/schema';
import { and, asc, eq, ilike, or, ne, notInArray, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/employees/public - Get employees for dropdown (no auth required)
export async function GET(_request: NextRequest) {
  try {

    const { searchParams } = new URL(_request.url);
    const limit = parseInt(searchParams.get('limit') || '1000');
    const search = searchParams.get('search') || '';
    const all = searchParams.get('all') === 'true';

    // Build filters
    // Only include active and internal employees (not soft-deleted)
    const filters: any[] = [
      eq(employeesTable.status, 'active'),
      eq(employeesTable.isExternal, false),
      isNull(employeesTable.deletedAt)
    ];
    if (search) {
      const s = `%${search}%`;
      filters.push(
        or(
          ilike(employeesTable.firstName, s),
          ilike(employeesTable.lastName, s),
          ilike(employeesTable.fileNumber, s),
          ilike(employeesTable.email as any, s)
        )
      );
    }

    const baseQuery = db
      .select({
        id: employeesTable.id,
        first_name: employeesTable.firstName,
        middle_name: employeesTable.middleName,
        last_name: employeesTable.lastName,
        employee_id: employeesTable.id,
        file_number: employeesTable.fileNumber,
        email: employeesTable.email,
        phone: employeesTable.phone,
        dept_name: departments.name,
        desig_name: designations.name,
        nationality: employeesTable.nationality,
        basic_salary: employeesTable.basicSalary,
        status: employeesTable.status,
      })
      .from(employeesTable)
      .leftJoin(departments, eq(departments.id, employeesTable.departmentId))
      .leftJoin(designations, eq(designations.id, employeesTable.designationId))
      .where(and(...filters))
      .orderBy(asc(employeesTable.firstName));

    const rows = await (all ? baseQuery : baseQuery.limit(limit));

    const transformedEmployees = rows.map(employee => ({
      id: String(employee.id),
      first_name: employee.first_name,
      middle_name: employee.middle_name,
      last_name: employee.last_name,
      employee_id: employee.employee_id,
      file_number: employee.file_number,
      email: employee.email,
      phone: employee.phone,
      department: employee.dept_name ? { name: employee.dept_name } : null,
      desig_name: employee.desig_name,
      designation: employee.desig_name ? { name: employee.desig_name } : null,
      nationality: employee.nationality,
      basic_salary: employee.basic_salary,
      status: employee.status,
    }));

    const response = {
      success: true,
      data: transformedEmployees,
      total: transformedEmployees.length,
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
