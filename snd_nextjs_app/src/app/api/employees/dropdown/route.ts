import { db } from '@/lib/db';
import { departments, designations, employees as employeesTable } from '@/lib/drizzle/schema';
import { and, asc, eq, ilike, or, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

// GET /api/employees/dropdown - Get all employees (internal and external) for dropdown
// Requires authentication (session) but no specific permissions since used in dropdowns throughout the app
export async function GET(_request: NextRequest) {
  try {
    // Check authentication - require valid session
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(_request.url);
    const limit = parseInt(searchParams.get('limit') || '1000');
    const search = searchParams.get('search') || '';
    const all = searchParams.get('all') === 'true';

    // Build filters
    // Include all active employees (both internal and external, not soft-deleted)
    const filters: any[] = [
      eq(employeesTable.status, 'active'),
      isNull(employeesTable.deletedAt)
    ];
    
    if (search) {
      const s = `%${search}%`;
      filters.push(
        or(
          ilike(employeesTable.firstName, s),
          ilike(employeesTable.lastName, s),
          ilike(employeesTable.fileNumber, s),
          ilike(employeesTable.email as any, s),
          ilike(employeesTable.companyName as any, s)
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
        is_external: employeesTable.isExternal,
        company_name: employeesTable.companyName,
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
      is_external: employee.is_external || false,
      company_name: employee.company_name || null,
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

