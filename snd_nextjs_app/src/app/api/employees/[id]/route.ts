import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Mock employee data with all fields
    const employee = {
      id: parseInt(id),
      file_number: 'EMP' + id.padStart(3, '0'),
      first_name: 'John',
      last_name: 'Doe',
      full_name: 'John Doe',
      email: 'john.doe@company.com',
      phone: '+966501234567',
      department: 'IT',
      designation: 'Software Engineer',
      status: 'active',
      hire_date: '2023-01-15',
      basic_salary: 8000,
      nationality: 'Saudi',
      hourly_rate: 50,
      date_of_birth: '1990-05-15',
      address: 'Riyadh, Saudi Arabia',
      city: 'Riyadh',
      state: 'Riyadh Province',
      postal_code: '12345',
      country: 'Saudi Arabia',
      emergency_contact_name: 'Jane Doe',
      emergency_contact_phone: '+966507654321',
      emergency_contact_relationship: 'Spouse',
      iqama_number: '1234567890',
      iqama_expiry: '2025-12-31',
      passport_number: 'A12345678',
      passport_expiry: '2026-06-30',
      driving_license_number: 'DL123456',
      driving_license_expiry: '2025-08-15',
      operator_license_number: 'OL789012',
      operator_license_expiry: '2025-10-20',
      tuv_certification_number: 'TUV123456',
      tuv_certification_expiry: '2025-09-30',
      spsp_license_number: 'SPSP789012',
      spsp_license_expiry: '2025-11-25',
      notes: 'Experienced software engineer with 5+ years of experience.',
      current_location: 'Riyadh Office'
    };

    return NextResponse.json({
      success: true,
      data: employee,
      message: 'Employee retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /api/employees/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch employee: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Mock update response
    return NextResponse.json({
      success: true,
      message: 'Employee updated successfully',
      data: { id: parseInt(id), ...body }
    });
  } catch (error) {
    console.error('Error in PUT /api/employees/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update employee: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Mock delete response
    return NextResponse.json({
      success: true,
      message: 'Employee deleted successfully',
      data: { id: parseInt(id) }
    });
  } catch (error) {
    console.error('Error in DELETE /api/employees/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete employee: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}
