import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withEmployeeOwnDataAccess } from '@/lib/rbac/api-middleware';

// GET /api/employees - List employees
const getEmployeesHandler = async (request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } }) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const department = searchParams.get('department') || '';
    const status = searchParams.get('status') || '';
    const all = searchParams.get('all') === 'true';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { employee_id: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (department) {
      where.department_id = parseInt(department);
    }

    if (status) {
      where.status = status;
    }

    // For employee users, only show their own record
    if (request.employeeAccess?.ownEmployeeId) {
      console.log('🔍 Employee filtering: ownEmployeeId =', request.employeeAccess.ownEmployeeId);
      where.id = request.employeeAccess.ownEmployeeId;
    } else {
      console.log('🔍 No employee filtering applied');
    }

    console.log('Fetching employees with assignments...');

    // Get employees with pagination
    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip: all ? 0 : skip,
        take: all ? undefined : limit,
        orderBy: { first_name: 'asc' },
        include: {
          department: true,
          designation: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              isActive: true,
            },
          },
          employee_assignments: {
            // Include all assignments for debugging
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
              rental: {
                select: {
                  id: true,
                  rental_number: true,
                },
              },
            },
            orderBy: {
              start_date: 'desc',
            },
            take: 1, // Get only the most recent assignment
          },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    console.log(`Found ${employees.length} employees`);
    console.log(`Total assignments found: ${employees.reduce((sum, emp) => sum + emp.employee_assignments.length, 0)}`);

    // Transform the data to include full_name, proper department/designation names, and current assignment
    const transformedEmployees = employees.map(employee => {
      // Get the current assignment (most recent assignment)
      const currentAssignment = employee.employee_assignments[0] || null;
      
      if (currentAssignment) {
        console.log(`Employee ${employee.file_number} has assignment:`, {
          id: currentAssignment.id,
          type: currentAssignment.type,
          name: currentAssignment.name,
          status: currentAssignment.status,
          start_date: currentAssignment.start_date,
          end_date: currentAssignment.end_date
        });
      }
      
      // Consider an assignment active if it has status 'active' and no end date or end date is in the future
      const isAssignmentActive = currentAssignment && 
        currentAssignment.status === 'active' && 
        (!currentAssignment.end_date || new Date(currentAssignment.end_date) > new Date());
      
      return {
        ...employee,
        full_name: [
          employee.first_name,
          employee.middle_name,
          employee.last_name
        ].filter(Boolean).join(' '),
        department: employee.department?.name || null,
        designation: employee.designation?.name || null,
        current_assignment: isAssignmentActive ? {
          id: currentAssignment.id,
          type: currentAssignment.type,
          name: currentAssignment.name || (currentAssignment.project?.name || currentAssignment.rental?.rental_number || 'Unnamed Assignment'),
          location: currentAssignment.location || null,
          start_date: currentAssignment.start_date?.toISOString() || null,
          end_date: currentAssignment.end_date?.toISOString() || null,
          status: currentAssignment.status,
          notes: currentAssignment.notes,
          project: currentAssignment.project,
          rental: currentAssignment.rental,
        } : null,
      };
    });

    const employeesWithAssignments = transformedEmployees.filter(emp => emp.current_assignment);
    console.log(`Employees with current assignments: ${employeesWithAssignments.length}`);

    return NextResponse.json({
      success: true,
      data: transformedEmployees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// POST /api/employees - Create new employee
const createEmployeeHandler = async (request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } }) => {
  try {
    const body = await request.json();
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
    const existingEmployee = await prisma.employee.findUnique({
      where: { employee_id },
    });

    if (existingEmployee) {
      return NextResponse.json(
        { error: 'Employee ID already exists' },
        { status: 409 }
      );
    }

    // Create new employee
    const employee = await prisma.employee.create({
      data: {
        first_name,
        last_name,
        employee_id,
        email,
        phone,
        department_id: department_id ? parseInt(department_id) : null,
        designation_id: designation_id ? parseInt(designation_id) : null,
        basic_salary: basic_salary ? parseFloat(basic_salary) : 0,
        hire_date: hire_date ? new Date(hire_date) : null,
        status: 'active',
        // ... other fields
      },
      include: {
        department: true,
        designation: true,
      },
    });

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
export const GET = withEmployeeOwnDataAccess(getEmployeesHandler);
export const POST = withEmployeeOwnDataAccess(createEmployeeHandler);