import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/rbac/api-middleware';
import { authConfig } from '@/lib/auth-config';
import { updateEmployeeStatusBasedOnLeave } from '@/lib/utils/employee-status';

// GET handler with employee data filtering
const getEmployeeHandler = async (
  request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } },
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const employeeId = parseInt(id);

    if (!employeeId) {
      return NextResponse.json(
        { error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    // For employee users, ensure they can only access their own employee record
    if (request.employeeAccess?.ownEmployeeId) {
      if (employeeId !== request.employeeAccess.ownEmployeeId) {
        return NextResponse.json(
          { error: "You can only access your own employee record" },
          { status: 403 }
        );
      }
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

    // Update employee status based on current leave status
    await updateEmployeeStatusBasedOnLeave(employeeId);
    
    // Fetch updated employee data after status update
    const updatedEmployee = await prisma.employee.findUnique({
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

    if (!updatedEmployee) {
      return NextResponse.json(
        { error: "Employee not found after status update" },
        { status: 404 }
      );
    }

    // Format the response
    const formattedEmployee = {
      id: updatedEmployee.id,
      file_number: updatedEmployee.file_number,
      first_name: updatedEmployee.first_name,
      middle_name: updatedEmployee.middle_name,
      last_name: updatedEmployee.last_name,
      full_name: `${updatedEmployee.first_name} ${updatedEmployee.middle_name ? updatedEmployee.middle_name + ' ' : ''}${updatedEmployee.last_name}`,
      email: updatedEmployee.email,
      phone: updatedEmployee.phone,
      employee_id: updatedEmployee.employee_id,
      department: updatedEmployee.department,
      designation: updatedEmployee.designation,
      status: updatedEmployee.status,
      hire_date: updatedEmployee.hire_date?.toISOString().slice(0, 10),
      basic_salary: updatedEmployee.basic_salary,
      nationality: updatedEmployee.nationality,
      hourly_rate: updatedEmployee.hourly_rate,
      overtime_rate_multiplier: updatedEmployee.overtime_rate_multiplier,
      overtime_fixed_rate: updatedEmployee.overtime_fixed_rate,
      contract_days_per_month: updatedEmployee.contract_days_per_month,
      contract_hours_per_day: updatedEmployee.contract_hours_per_day,
      date_of_birth: updatedEmployee.date_of_birth?.toISOString().slice(0, 10),
      address: updatedEmployee.address,
      city: updatedEmployee.city,
      state: updatedEmployee.state,
      postal_code: updatedEmployee.postal_code,
      country: updatedEmployee.country,
      emergency_contact_name: updatedEmployee.emergency_contact_name,
      emergency_contact_phone: updatedEmployee.emergency_contact_phone,
      emergency_contact_relationship: updatedEmployee.emergency_contact_relationship,
      iqama_number: updatedEmployee.iqama_number,
      iqama_expiry: updatedEmployee.iqama_expiry?.toISOString().slice(0, 10),
      passport_number: updatedEmployee.passport_number,
      passport_expiry: updatedEmployee.passport_expiry?.toISOString().slice(0, 10),
      driving_license_number: updatedEmployee.driving_license_number,
      driving_license_expiry: updatedEmployee.driving_license_expiry?.toISOString().slice(0, 10),
      operator_license_number: updatedEmployee.operator_license_number,
      operator_license_expiry: updatedEmployee.operator_license_expiry?.toISOString().slice(0, 10),
      tuv_certification_number: updatedEmployee.tuv_certification_number,
      tuv_certification_expiry: updatedEmployee.tuv_certification_expiry?.toISOString().slice(0, 10),
      spsp_license_number: updatedEmployee.spsp_license_number,
              spsp_license_expiry: updatedEmployee.spsp_license_expiry?.toISOString().slice(0, 10),
        notes: updatedEmployee.notes,
      current_location: updatedEmployee.current_location,
      food_allowance: updatedEmployee.food_allowance,
      housing_allowance: updatedEmployee.housing_allowance,
      transport_allowance: updatedEmployee.transport_allowance,
      supervisor: updatedEmployee.supervisor,
      iqama_file: updatedEmployee.iqama_file,
      passport_file: updatedEmployee.passport_file,
      driving_license_file: updatedEmployee.driving_license_file,
      operator_license_file: updatedEmployee.operator_license_file,
      tuv_certification_file: updatedEmployee.tuv_certification_file,
      spsp_license_file: updatedEmployee.spsp_license_file,
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
};

// PUT handler with employee data filtering
const updateEmployeeHandler = async (
  request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } },
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const employeeId = parseInt(id);
    const body = await request.json();

    if (!employeeId) {
      return NextResponse.json(
        { error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    // For employee users, ensure they can only update their own employee record
    if (request.employeeAccess?.ownEmployeeId) {
      if (employeeId !== request.employeeAccess.ownEmployeeId) {
        return NextResponse.json(
          { error: "You can only update your own employee record" },
          { status: 403 }
        );
      }
    }

    // Build partial update payload: only mutate fields present in body
    const updateDataRaw: Record<string, any> = body || {};
    const prismaData: Record<string, any> = {};

    const dateFields = [
      'hire_date',
      'date_of_birth',
      'iqama_expiry',
      'passport_expiry',
      'driving_license_expiry',
      'operator_license_expiry',
      'tuv_certification_expiry',
      'spsp_license_expiry',
    ];
    for (const key of dateFields) {
      if (Object.prototype.hasOwnProperty.call(updateDataRaw, key)) {
        const v = updateDataRaw[key];
        prismaData[key] = v && typeof v === 'string' && v.trim() !== '' ? new Date(v) : null;
      }
    }

    const numberFieldsFloat = [
      'hourly_rate',
      'basic_salary',
      'overtime_rate_multiplier',
      'overtime_fixed_rate',
    ];
    for (const key of numberFieldsFloat) {
      if (Object.prototype.hasOwnProperty.call(updateDataRaw, key)) {
        const v = updateDataRaw[key];
        prismaData[key] = v === '' || v === null || v === undefined ? null : parseFloat(v);
      }
    }

    const numberFieldsInt = [
      'contract_days_per_month',
      'contract_hours_per_day',
    ];
    for (const key of numberFieldsInt) {
      if (Object.prototype.hasOwnProperty.call(updateDataRaw, key)) {
        const v = updateDataRaw[key];
        prismaData[key] = v === '' || v === null || v === undefined ? null : parseInt(v);
      }
    }

    // Pass-through other primitive fields if present
    const passthroughFields = [
      'first_name','middle_name','last_name','email','phone','address','city','state','postal_code','country','nationality','department_id','designation_id','supervisor','status','notes','iqama_number','passport_number','driving_license_number','operator_license_number','tuv_certification_number','spsp_license_number','advance_salary_eligible','advance_salary_approved_this_month'
    ];
    for (const key of passthroughFields) {
      if (Object.prototype.hasOwnProperty.call(updateDataRaw, key)) {
        prismaData[key] = updateDataRaw[key];
      }
    }

    // Auto-calc hourly_rate only if basic_salary and contract fields are part of this update
    if (
      Object.prototype.hasOwnProperty.call(prismaData, 'basic_salary') &&
      prismaData.basic_salary &&
      (Object.prototype.hasOwnProperty.call(prismaData, 'contract_days_per_month') || Object.prototype.hasOwnProperty.call(prismaData, 'contract_hours_per_day'))
    ) {
      const days = prismaData.contract_days_per_month ?? 26;
      const hours = prismaData.contract_hours_per_day ?? 8;
      if (days > 0 && hours > 0) {
        prismaData.hourly_rate = Math.round((Number(prismaData.basic_salary) / (days * hours)) * 100) / 100;
      }
    }

    // Update employee in database
    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: prismaData,
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
};

// DELETE handler with employee data filtering
const deleteEmployeeHandler = async (
  request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } },
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const employeeId = parseInt(id);

    if (!employeeId) {
      return NextResponse.json(
        { error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    // For employee users, ensure they can only delete their own employee record
    if (request.employeeAccess?.ownEmployeeId) {
      if (employeeId !== request.employeeAccess.ownEmployeeId) {
        return NextResponse.json(
          { error: "You can only delete your own employee record" },
          { status: 403 }
        );
      }
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
};

// Export the wrapped handlers
export const GET = withAuth(getEmployeeHandler);
export const PUT = withAuth(updateEmployeeHandler);
export const DELETE = withAuth(deleteEmployeeHandler);
