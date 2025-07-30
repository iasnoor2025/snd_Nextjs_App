import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const employeeId = parseInt(id);

    if (!employeeId) {
      return NextResponse.json(
        { error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    // Fetch employee data from database
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        designation: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Format the response
    const formattedEmployee = {
      id: employee.id,
      file_number: employee.file_number,
      first_name: employee.first_name,
      middle_name: employee.middle_name,
      last_name: employee.last_name,
      full_name: `${employee.first_name} ${employee.middle_name ? employee.middle_name + ' ' : ''}${employee.last_name}`,
      email: employee.email,
      phone: employee.phone,
      employee_id: employee.employee_id,
      department: employee.department,
      designation: employee.designation,
      status: employee.status,
      hire_date: employee.hire_date?.toISOString().slice(0, 10),
      basic_salary: employee.basic_salary,
      nationality: employee.nationality,
      hourly_rate: employee.hourly_rate,
      date_of_birth: employee.date_of_birth?.toISOString().slice(0, 10),
      address: employee.address,
      city: employee.city,
      state: employee.state,
      postal_code: employee.postal_code,
      country: employee.country,
      emergency_contact_name: employee.emergency_contact_name,
      emergency_contact_phone: employee.emergency_contact_phone,
      emergency_contact_relationship: employee.emergency_contact_relationship,
      iqama_number: employee.iqama_number,
      iqama_expiry: employee.iqama_expiry?.toISOString().slice(0, 10),
      passport_number: employee.passport_number,
      passport_expiry: employee.passport_expiry?.toISOString().slice(0, 10),
      driving_license_number: employee.driving_license_number,
      driving_license_expiry: employee.driving_license_expiry?.toISOString().slice(0, 10),
      operator_license_number: employee.operator_license_number,
      operator_license_expiry: employee.operator_license_expiry?.toISOString().slice(0, 10),
      tuv_certification_number: employee.tuv_certification_number,
      tuv_certification_expiry: employee.tuv_certification_expiry?.toISOString().slice(0, 10),
      spsp_license_number: employee.spsp_license_number,
      spsp_license_expiry: employee.spsp_license_expiry?.toISOString().slice(0, 10),
      notes: employee.notes,
      current_location: employee.current_location,
      food_allowance: employee.food_allowance,
      housing_allowance: employee.housing_allowance,
      transport_allowance: employee.transport_allowance,
      supervisor: employee.supervisor,
      iqama_file: employee.iqama_file,
      passport_file: employee.passport_file,
      driving_license_file: employee.driving_license_file,
      operator_license_file: employee.operator_license_file,
      tuv_certification_file: employee.tuv_certification_file,
      spsp_license_file: employee.spsp_license_file,
    };

    return NextResponse.json({
      success: true,
      employee: formattedEmployee,
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const employeeId = parseInt(id);
    const body = await request.json();

    if (!employeeId) {
      return NextResponse.json(
        { error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    // Update employee in database
    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: body,
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        designation: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Employee updated successfully',
      employee: updatedEmployee
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const employeeId = parseInt(id);

    if (!employeeId) {
      return NextResponse.json(
        { error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    // Soft delete employee
    await prisma.employee.update({
      where: { id: employeeId },
      data: { deleted_at: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Employee deleted successfully'
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
