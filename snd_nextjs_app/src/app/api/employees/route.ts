import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Helper function to format employee data for frontend
function formatEmployeeForFrontend(employee: any) {
  // Debug: Log assignment info for first few employees
  if (employee.id <= 5) {
    console.log(`Employee ${employee.id} (${employee.first_name} ${employee.last_name}):`, {
      hasAssignments: employee.employee_assignments && employee.employee_assignments.length > 0,
      assignmentCount: employee.employee_assignments ? employee.employee_assignments.length : 0,
      firstAssignment: employee.employee_assignments && employee.employee_assignments.length > 0 ? employee.employee_assignments[0] : null
    });
  }

  return {
    id: employee.id,
    employee_id: employee.employee_id,
    erpnext_id: employee.erpnext_id,
    file_number: employee.file_number,
    first_name: employee.first_name,
    middle_name: employee.middle_name,
    last_name: employee.last_name,
    full_name: `${employee.first_name || ''} ${employee.middle_name ? employee.middle_name + ' ' : ''}${employee.last_name || ''}`.trim(),
    email: employee.email,
    phone: employee.phone,
    address: employee.address,
    city: employee.city,
    state: employee.state,
    postal_code: employee.postal_code,
    country: employee.country,
    nationality: employee.nationality,
    date_of_birth: employee.date_of_birth?.toISOString().split('T')[0] || null,
    hire_date: employee.hire_date?.toISOString().split('T')[0] || null,
    department: employee.department?.name || 'General',
    designation: employee.designation?.name || 'Employee',
    unit: employee.unit?.name || null,
    supervisor: employee.supervisor,
    status: employee.status,
    current_location: employee.current_location,
    basic_salary: parseFloat(employee.basic_salary?.toString() || '0'),
    food_allowance: parseFloat(employee.food_allowance?.toString() || '0'),
    housing_allowance: parseFloat(employee.housing_allowance?.toString() || '0'),
    transport_allowance: parseFloat(employee.transport_allowance?.toString() || '0'),
    hourly_rate: parseFloat(employee.hourly_rate?.toString() || '0'),
    absent_deduction_rate: parseFloat(employee.absent_deduction_rate?.toString() || '0'),
    overtime_rate_multiplier: parseFloat(employee.overtime_rate_multiplier?.toString() || '1.5'),
    overtime_fixed_rate: parseFloat(employee.overtime_fixed_rate?.toString() || '0'),
    bank_name: employee.bank_name,
    bank_account_number: employee.bank_account_number,
    bank_iban: employee.bank_iban,
    contract_hours_per_day: employee.contract_hours_per_day || 8,
    contract_days_per_month: employee.contract_days_per_month || 26,
    emergency_contact_name: employee.emergency_contact_name,
    emergency_contact_phone: employee.emergency_contact_phone,
    emergency_contact_relationship: employee.emergency_contact_relationship,
    notes: employee.notes,
    advance_salary_eligible: employee.advance_salary_eligible,
    advance_salary_approved_this_month: employee.advance_salary_approved_this_month,
    iqama_number: employee.iqama_number,
    iqama_expiry: employee.iqama_expiry?.toISOString().split('T')[0] || null,
    iqama_cost: parseFloat(employee.iqama_cost?.toString() || '0'),
    passport_number: employee.passport_number,
    passport_expiry: employee.passport_expiry?.toISOString().split('T')[0] || null,
    driving_license_number: employee.driving_license_number,
    driving_license_expiry: employee.driving_license_expiry?.toISOString().split('T')[0] || null,
    driving_license_cost: parseFloat(employee.driving_license_cost?.toString() || '0'),
    operator_license_number: employee.operator_license_number,
    operator_license_expiry: employee.operator_license_expiry?.toISOString().split('T')[0] || null,
    operator_license_cost: parseFloat(employee.operator_license_cost?.toString() || '0'),
    tuv_certification_number: employee.tuv_certification_number,
    tuv_certification_expiry: employee.tuv_certification_expiry?.toISOString().split('T')[0] || null,
    tuv_certification_cost: parseFloat(employee.tuv_certification_cost?.toString() || '0'),
    spsp_license_number: employee.spsp_license_number,
    spsp_license_expiry: employee.spsp_license_expiry?.toISOString().split('T')[0] || null,
    spsp_license_cost: parseFloat(employee.spsp_license_cost?.toString() || '0'),
    driving_license_file: employee.driving_license_file,
    operator_license_file: employee.operator_license_file,
    tuv_certification_file: employee.tuv_certification_file,
    spsp_license_file: employee.spsp_license_file,
    passport_file: employee.passport_file,
    iqama_file: employee.iqama_file,
    custom_certifications: employee.custom_certifications,
    is_operator: employee.is_operator,
    access_restricted_until: employee.access_restricted_until?.toISOString().split('T')[0] || null,
    access_start_date: employee.access_start_date?.toISOString().split('T')[0] || null,
    access_end_date: employee.access_end_date?.toISOString().split('T')[0] || null,
    access_restriction_reason: employee.access_restriction_reason,
    created_at: employee.created_at?.toISOString().split('T')[0] || null,
    updated_at: employee.updated_at?.toISOString().split('T')[0] || null,
    // Current assignment information
    current_assignment: employee.employee_assignments && employee.employee_assignments.length > 0 ? {
      id: employee.employee_assignments[0].id,
      type: employee.employee_assignments[0].type,
      name: employee.employee_assignments[0].name,
      location: employee.employee_assignments[0].location,
      start_date: employee.employee_assignments[0].start_date?.toISOString().split('T')[0] || null,
      end_date: employee.employee_assignments[0].end_date?.toISOString().split('T')[0] || null,
      status: employee.employee_assignments[0].status,
      notes: employee.employee_assignments[0].notes,
      project: employee.employee_assignments[0].project ? {
        id: employee.employee_assignments[0].project.id,
        name: employee.employee_assignments[0].project.name,
        location: null
      } : null,
      rental: employee.employee_assignments[0].rental ? {
        id: employee.employee_assignments[0].rental.id,
        project_name: employee.employee_assignments[0].rental.customer?.name || 'Unknown Customer',
        rental_number: employee.employee_assignments[0].rental.rental_number,
        location: null
      } : null
    } : null
  };
}

export async function GET(request: NextRequest) {
  try {
    console.log('Employees API called');

    // Test database connection first
    try {
      await prisma.$connect();
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        {
          success: false,
          message: 'Database connection failed: ' + (dbError instanceof Error ? dbError.message : 'Unknown error'),
        },
        { status: 500 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const getAll = searchParams.get('all') === 'true';
    const offset = getAll ? 0 : (page - 1) * limit;

    console.log('Query parameters:', { search, status, department, page, limit });

    // Fetch employees from database with assignments
    const employees = await prisma.employee.findMany({
      include: {
        department: true,
        designation: true,
        unit: true,
        employee_assignments: {
          where: {
            status: 'active'
          },
          include: {
            project: {
              select: {
                id: true,
                name: true
              }
            },
            rental: {
              select: {
                id: true,
                rental_number: true,
                customer: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
          orderBy: {
            start_date: 'desc'
          },
          take: 1 // Get only the most recent active assignment
        }
      },
      skip: offset,
      take: getAll ? undefined : limit,
      orderBy: [
        { first_name: 'asc' },
        { last_name: 'asc' }
      ]
    });

    console.log(`Found ${employees.length} employees`);

    // Debug: Check if any employees have assignments
    const employeesWithAssignments = employees.filter(emp => emp.employee_assignments && emp.employee_assignments.length > 0);
    console.log(`Employees with assignments: ${employeesWithAssignments.length}`);

    // Format employees for frontend
    const formattedEmployees = employees.map(employee => formatEmployeeForFrontend(employee));

    // Get total count for pagination
    const totalCount = await prisma.employee.count();

    return NextResponse.json({
      success: true,
      data: formattedEmployees,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      message: 'Employees retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /api/employees:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch employees: ' + (error as Error).message,
        error: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace'
        }
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.first_name || !body.last_name || !body.file_number) {
      return NextResponse.json(
        {
          success: false,
          message: 'First name, last name, and file number are required'
        },
        { status: 400 }
      );
    }

    // Check if employee with same file number already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { file_number: body.file_number }
    });

    if (existingEmployee) {
      return NextResponse.json(
        {
          success: false,
          message: 'Employee with this file number already exists'
        },
        { status: 400 }
      );
    }

    // Create employee
    const newEmployee = await prisma.employee.create({
      data: {
        employee_id: body.file_number, // Use file_number as employeeId
        first_name: body.first_name,
        last_name: body.last_name,
        file_number: body.file_number,
        basic_salary: body.basic_salary || 0,
        status: body.status || 'active',
        email: body.email,
        phone: body.phone,
        hire_date: body.hire_date ? new Date(body.hire_date) : null,
        hourly_rate: body.hourly_rate || null,
        overtime_rate_multiplier: body.overtime_rate_multiplier || 1.5,
        overtime_fixed_rate: body.overtime_fixed_rate || null,
        nationality: body.nationality || null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Employee created successfully',
      data: newEmployee
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create employee: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}


