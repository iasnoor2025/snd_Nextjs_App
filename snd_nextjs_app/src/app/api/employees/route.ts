import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/rbac/api-middleware';
import { updateEmployeeStatusBasedOnLeave } from '@/lib/utils/employee-status';
import { employees as employeesTable, departments, designations, users as usersTable, employeeAssignments, projects, rentals } from '@/lib/drizzle/schema';
import { and, asc, desc, eq, ilike, or, sql, inArray } from 'drizzle-orm';

// GET /api/employees - List employees
const getEmployeesHandler = async (request: NextRequest) => {
  try {
    console.log('🔍 Starting employee fetch...');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const department = searchParams.get('department') || '';
    const status = searchParams.get('status') || '';
    const all = searchParams.get('all') === 'true';

    console.log('🔍 Search params:', { page, limit, search, department, status, all });

    const skip = (page - 1) * limit;

    // Build filters
    const filters: any[] = [];
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
    if (department) {
      filters.push(eq(employeesTable.departmentId, parseInt(department)));
    }
    if (status) {
      filters.push(eq(employeesTable.status, status));
    }

    // No employee filtering - all authenticated users can see all employees
    console.log('🔍 No employee filtering applied');

    console.log('🔍 Filter count:', filters.length);

    const whereExpr = filters.length ? and(...filters) : undefined;

    console.log('🔍 Executing employee query with assignments...');
    let baseQuery = db
      .select({
        id: employeesTable.id,
        first_name: employeesTable.firstName,
        middle_name: employeesTable.middleName,
        last_name: employeesTable.lastName,
        employee_id: employeesTable.fileNumber,
        file_number: employeesTable.fileNumber,
        email: employeesTable.email,
        phone: employeesTable.phone,
        department_id: employeesTable.departmentId,
        designation_id: employeesTable.designationId,
        status: employeesTable.status,
        basic_salary: employeesTable.basicSalary,
        hire_date: employeesTable.hireDate,
        iqama_number: employeesTable.iqamaNumber,
        iqama_expiry: employeesTable.iqamaExpiry,
        nationality: employeesTable.nationality,
        hourly_rate: employeesTable.hourlyRate,
        overtime_rate_multiplier: employeesTable.overtimeRateMultiplier,
        overtime_fixed_rate: employeesTable.overtimeFixedRate,
        dept_name: departments.name,
        desig_name: designations.name,
        user_id: usersTable.id,
        user_name: usersTable.name,
        user_email: usersTable.email,
        user_is_active: usersTable.isActive,
      })
      .from(employeesTable)
      .leftJoin(departments, eq(departments.id, employeesTable.departmentId))
      .leftJoin(designations, eq(designations.id, employeesTable.designationId))
      .leftJoin(usersTable, eq(usersTable.id, employeesTable.userId))
      .where(whereExpr as any)
      .orderBy(asc(employeesTable.firstName));

    const employeeRows = await (!all ? baseQuery.offset(skip).limit(limit) : baseQuery);

    const countRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(employeesTable)
      .where(whereExpr as any);
    const total = Number((countRow as any)[0]?.count ?? 0);

    console.log(`✅ Found ${employeeRows.length} employees out of ${total} total`);

    // Update employee statuses based on current leave status
    console.log('🔄 Updating employee statuses based on leave...');
    const statusUpdatePromises = employeeRows.map(employee => 
      updateEmployeeStatusBasedOnLeave(employee.id as number)
    );
    await Promise.all(statusUpdatePromises);
    console.log('✅ Employee statuses updated');

    // Fetch latest assignment per employee in this page
    const employeeFileNumbers = employeeRows.map(e => e.file_number as string).filter(Boolean);
    let latestAssignments: Record<string, any> = {};
    if (employeeFileNumbers.length > 0) {
      const assignmentRows = await db
        .select({
          id: employeeAssignments.id,
          employee_file_number: employeesTable.fileNumber,
          type: employeeAssignments.type,
          name: employeeAssignments.name,
          status: employeeAssignments.status,
          start_date: employeeAssignments.startDate,
          end_date: employeeAssignments.endDate,
          location: employeeAssignments.location,
          notes: employeeAssignments.notes,
          project_name: projects.name,
          rental_number: rentals.rentalNumber,
        })
        .from(employeeAssignments)
        .innerJoin(employeesTable, eq(employeesTable.id, employeeAssignments.employeeId))
        .leftJoin(projects, eq(projects.id, employeeAssignments.projectId))
        .leftJoin(rentals, eq(rentals.id, employeeAssignments.rentalId))
        .where(inArray(employeesTable.fileNumber, employeeFileNumbers))
        .orderBy(desc(employeeAssignments.startDate));
      for (const row of assignmentRows) {
        const empFileNumber = row.employee_file_number as string;
        if (!latestAssignments[empFileNumber]) {
          latestAssignments[empFileNumber] = row;
        }
      }
    }

    // Transform
    const transformedEmployees = employeeRows.map(employee => {
      const fullName = [employee.first_name, employee.middle_name, employee.last_name].filter(Boolean).join(' ');
      const currentAssignment = latestAssignments[employee.file_number as string] || null;
      const isAssignmentActive = currentAssignment && currentAssignment.status === 'active' && (!currentAssignment.end_date || new Date(currentAssignment.end_date as unknown as string) > new Date());
      return {
        id: employee.id,
        first_name: employee.first_name,
        middle_name: employee.middle_name,
        last_name: employee.last_name,
        employee_id: employee.employee_id,
        file_number: employee.file_number || null,
        email: employee.email || null,
        phone: employee.phone || null,
        status: employee.status || null,
        full_name: fullName,
        department: employee.dept_name || null,
        designation: employee.desig_name || null,
        hire_date: employee.hire_date || null,
        iqama_number: employee.iqama_number || null,
        iqama_expiry: employee.iqama_expiry || null,
        nationality: employee.nationality || null,
        basic_salary: employee.basic_salary ? Number(employee.basic_salary) : null,
        hourly_rate: employee.hourly_rate ? Number(employee.hourly_rate) : null,
        overtime_rate_multiplier: employee.overtime_rate_multiplier ? Number(employee.overtime_rate_multiplier) : null,
        overtime_fixed_rate: employee.overtime_fixed_rate ? Number(employee.overtime_fixed_rate) : null,
        current_assignment: isAssignmentActive ? {
          id: currentAssignment.id,
          type: currentAssignment.type,
          name: currentAssignment.name || (currentAssignment.project_name || currentAssignment.rental_number || 'Unnamed Assignment'),
          location: currentAssignment.location || null,
          start_date: currentAssignment.start_date ? new Date(currentAssignment.start_date as unknown as string).toISOString() : null,
          end_date: currentAssignment.end_date ? new Date(currentAssignment.end_date as unknown as string).toISOString() : null,
          status: currentAssignment.status,
          notes: currentAssignment.notes,
          project: currentAssignment.project_name ? { name: currentAssignment.project_name } : null,
          rental: currentAssignment.rental_number ? { rental_number: currentAssignment.rental_number } : null,
        } : null,
        user: employee.user_id ? { id: employee.user_id, name: employee.user_name, email: employee.user_email, isActive: employee.user_is_active } : null,
      };
    });

    const employeesWithAssignments = transformedEmployees.filter(emp => emp.current_assignment);
    console.log(`✅ Employees with current assignments: ${employeesWithAssignments.length}`);
    console.log(`✅ Transformed ${transformedEmployees.length} employees`);

    const response = {
      success: true,
      data: transformedEmployees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
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
};

// POST /api/employees - Create new employee
const createEmployeeHandler = async (request: NextRequest) => {
  try {
    const body = await _request.json();
    const {
      first_name,
      last_name,
      employee_id,
      email,
      phone,
      department_id,
      designation_id,
      basic_salary,
      hire_date,
      // ... other fields
    } = body;

    if (!first_name || !last_name || !employee_id) {
      return NextResponse.json(
        { error: 'First name, last name, and employee ID are required' },
        { status: 400 }
      );
    }

    // Check if employee ID already exists
    const existing = await db
      .select({ id: employeesTable.id })
      .from(employeesTable)
      .where(eq(employeesTable.fileNumber, employee_id))
      .limit(1);
    const existingEmployee = existing[0];

    if (existingEmployee) {
      return NextResponse.json(
        { error: 'Employee ID already exists' },
        { status: 409 }
      );
    }

    // Create new employee
    const inserted = await db
      .insert(employeesTable)
      .values({
        firstName: first_name,
        lastName: last_name,
        fileNumber: employee_id,
        email: email ?? null,
        phone: phone ?? null,
        departmentId: department_id ? parseInt(department_id) : null,
        designationId: designation_id ? parseInt(designation_id) : null,
        basicSalary: basic_salary ? String(parseFloat(basic_salary)) : '0',
        hireDate: hire_date ? new Date(hire_date).toISOString() : null,
        status: 'active',
        updatedAt: new Date().toISOString(),
      })
      .returning();
    const employee = inserted[0];

    return NextResponse.json({
      message: 'Employee created successfully',
      employee,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// Export the wrapped handlers
export const GET = withAuth(getEmployeesHandler);
export const POST = withAuth(createEmployeeHandler);
