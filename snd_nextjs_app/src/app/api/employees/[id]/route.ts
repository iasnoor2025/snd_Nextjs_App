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

    // Convert date strings to Date objects for Prisma
    const updateData = { ...body };
    
    // Convert date fields to proper Date objects
    if (updateData.hire_date && updateData.hire_date.trim() !== '') {
      updateData.hire_date = new Date(updateData.hire_date);
    } else {
      updateData.hire_date = null;
    }
    if (updateData.date_of_birth && updateData.date_of_birth.trim() !== '') {
      updateData.date_of_birth = new Date(updateData.date_of_birth);
    } else {
      updateData.date_of_birth = null;
    }
    if (updateData.iqama_expiry && updateData.iqama_expiry.trim() !== '') {
      updateData.iqama_expiry = new Date(updateData.iqama_expiry);
    } else {
      updateData.iqama_expiry = null;
    }
    if (updateData.passport_expiry && updateData.passport_expiry.trim() !== '') {
      updateData.passport_expiry = new Date(updateData.passport_expiry);
    } else {
      updateData.passport_expiry = null;
    }
    if (updateData.driving_license_expiry && updateData.driving_license_expiry.trim() !== '') {
      updateData.driving_license_expiry = new Date(updateData.driving_license_expiry);
    } else {
      updateData.driving_license_expiry = null;
    }
    if (updateData.operator_license_expiry && updateData.operator_license_expiry.trim() !== '') {
      updateData.operator_license_expiry = new Date(updateData.operator_license_expiry);
    } else {
      updateData.operator_license_expiry = null;
    }
    if (updateData.tuv_certification_expiry && updateData.tuv_certification_expiry.trim() !== '') {
      updateData.tuv_certification_expiry = new Date(updateData.tuv_certification_expiry);
    } else {
      updateData.tuv_certification_expiry = null;
    }
    if (updateData.spsp_license_expiry && updateData.spsp_license_expiry.trim() !== '') {
      updateData.spsp_license_expiry = new Date(updateData.spsp_license_expiry);
    } else {
      updateData.spsp_license_expiry = null;
    }

    // Convert numeric fields to proper numbers
    if (updateData.hourly_rate !== undefined && updateData.hourly_rate !== null) {
      updateData.hourly_rate = parseFloat(updateData.hourly_rate);
    } else {
      updateData.hourly_rate = null;
    }
    
    if (updateData.basic_salary !== undefined && updateData.basic_salary !== null) {
      updateData.basic_salary = parseFloat(updateData.basic_salary);
    } else {
      updateData.basic_salary = null;
    }

    if (updateData.overtime_rate_multiplier !== undefined && updateData.overtime_rate_multiplier !== null) {
      updateData.overtime_rate_multiplier = parseFloat(updateData.overtime_rate_multiplier);
    } else {
      updateData.overtime_rate_multiplier = 1.5; // Default value
    }

    if (updateData.overtime_fixed_rate !== undefined && updateData.overtime_fixed_rate !== null) {
      updateData.overtime_fixed_rate = parseFloat(updateData.overtime_fixed_rate);
    } else {
      updateData.overtime_fixed_rate = null;
    }

    // Handle contract fields
    if (updateData.contract_days_per_month !== undefined && updateData.contract_days_per_month !== null) {
      updateData.contract_days_per_month = parseInt(updateData.contract_days_per_month);
    } else {
      updateData.contract_days_per_month = 26; // Default value
    }

    if (updateData.contract_hours_per_day !== undefined && updateData.contract_hours_per_day !== null) {
      updateData.contract_hours_per_day = parseInt(updateData.contract_hours_per_day);
    } else {
      updateData.contract_hours_per_day = 8; // Default value
    }

    // Auto-calculate hourly rate if basic salary is provided (same as Laravel logic)
    if (updateData.basic_salary && updateData.basic_salary > 0) {
      const days = updateData.contract_days_per_month || 26;
      const hours = updateData.contract_hours_per_day || 8;
      if (days > 0 && hours > 0) {
        updateData.hourly_rate = Math.round((updateData.basic_salary / (days * hours)) * 100) / 100;
      }
    }

    // Update employee in database
    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: updateData,
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
