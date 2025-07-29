import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Helper function to format employee data for frontend
function formatEmployeeForFrontend(employee: any) {
  return {
    id: employee.id,
    erpnext_id: employee.erpnextId,
    file_number: employee.fileNumber,
    first_name: employee.firstName,
    middle_name: employee.middleName,
    last_name: employee.lastName,
    full_name: `${employee.firstName} ${employee.middleName ? employee.middleName + ' ' : ''}${employee.lastName}`,
    email: employee.email,
    phone: employee.phone,
    address: employee.address,
    city: employee.city,
    state: employee.state,
    postal_code: employee.postalCode,
    country: employee.country,
    nationality: employee.nationality,
    date_of_birth: employee.dateOfBirth?.toISOString().split('T')[0] || null,
    hire_date: employee.hireDate?.toISOString().split('T')[0] || null,
    department: employee.department?.name || 'General',
    designation: employee.designation?.name || 'Employee',
    unit: employee.unit?.name || null,
    supervisor: employee.supervisor,
    status: employee.status,
    current_location: employee.currentLocation,
    basic_salary: parseFloat(employee.basicSalary?.toString() || '0'),
    food_allowance: parseFloat(employee.foodAllowance?.toString() || '0'),
    housing_allowance: parseFloat(employee.housingAllowance?.toString() || '0'),
    transport_allowance: parseFloat(employee.transportAllowance?.toString() || '0'),
    hourly_rate: parseFloat(employee.hourlyRate?.toString() || '0'),
    absent_deduction_rate: parseFloat(employee.absentDeductionRate?.toString() || '0'),
    overtime_rate_multiplier: parseFloat(employee.overtimeRateMultiplier?.toString() || '1.5'),
    overtime_fixed_rate: parseFloat(employee.overtimeFixedRate?.toString() || '0'),
    bank_name: employee.bankName,
    bank_account_number: employee.bankAccountNumber,
    bank_iban: employee.bankIban,
    contract_hours_per_day: employee.contractHoursPerDay || 8,
    contract_days_per_month: employee.contractDaysPerMonth || 26,
    emergency_contact_name: employee.emergencyContactName,
    emergency_contact_phone: employee.emergencyContactPhone,
    emergency_contact_relationship: employee.emergencyContactRelationship,
    notes: employee.notes,
    advance_salary_eligible: employee.advanceSalaryEligible,
    advance_salary_approved_this_month: employee.advanceSalaryApprovedThisMonth,
    iqama_number: employee.iqamaNumber,
    iqama_expiry: employee.iqamaExpiry?.toISOString().split('T')[0] || null,
    iqama_cost: parseFloat(employee.iqamaCost?.toString() || '0'),
    passport_number: employee.passportNumber,
    passport_expiry: employee.passportExpiry?.toISOString().split('T')[0] || null,
    driving_license_number: employee.drivingLicenseNumber,
    driving_license_expiry: employee.drivingLicenseExpiry?.toISOString().split('T')[0] || null,
    driving_license_cost: parseFloat(employee.drivingLicenseCost?.toString() || '0'),
    operator_license_number: employee.operatorLicenseNumber,
    operator_license_expiry: employee.operatorLicenseExpiry?.toISOString().split('T')[0] || null,
    operator_license_cost: parseFloat(employee.operatorLicenseCost?.toString() || '0'),
    tuv_certification_number: employee.tuvCertificationNumber,
    tuv_certification_expiry: employee.tuvCertificationExpiry?.toISOString().split('T')[0] || null,
    tuv_certification_cost: parseFloat(employee.tuvCertificationCost?.toString() || '0'),
    spsp_license_number: employee.spspLicenseNumber,
    spsp_license_expiry: employee.spspLicenseExpiry?.toISOString().split('T')[0] || null,
    spsp_license_cost: parseFloat(employee.spspLicenseCost?.toString() || '0'),
    driving_license_file: employee.drivingLicenseFile,
    operator_license_file: employee.operatorLicenseFile,
    tuv_certification_file: employee.tuvCertificationFile,
    spsp_license_file: employee.spspLicenseFile,
    passport_file: employee.passportFile,
    iqama_file: employee.iqamaFile,
    custom_certifications: employee.customCertifications,
    is_operator: employee.isOperator,
    access_restricted_until: employee.accessRestrictedUntil?.toISOString().split('T')[0] || null,
    access_start_date: employee.accessStartDate?.toISOString().split('T')[0] || null,
    access_end_date: employee.accessEndDate?.toISOString().split('T')[0] || null,
    access_restriction_reason: employee.accessRestrictionReason,
    created_at: employee.createdAt?.toISOString().split('T')[0] || null,
    updated_at: employee.updatedAt?.toISOString().split('T')[0] || null,
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
    const offset = (page - 1) * limit;

    console.log('Query parameters:', { search, status, department, page, limit });

    // Fetch employees from database
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        status: true,
        file_number: true,
        employee_id: true,
        basic_salary: true,
        hire_date: true,
        department_id: true,
        designation_id: true,
      } as any,
      skip: offset,
      take: limit,
      orderBy: [
        { id: 'asc' }
      ]
    });

    console.log(`Found ${employees.length} employees`);

    // Get total count for pagination
    const totalCount = await prisma.employee.count();

    return NextResponse.json({
      success: true,
      data: employees,
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
      where: { fileNumber: body.file_number }
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
        employeeId: body.file_number, // Use file_number as employeeId
        firstName: body.first_name,
        lastName: body.last_name,
        fileNumber: body.file_number,
        basicSalary: body.basic_salary || 0,
        status: body.status || 'active',
        email: body.email,
        phone: body.phone,
        hireDate: body.hire_date ? new Date(body.hire_date) : null
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


