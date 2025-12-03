import { db } from '@/lib/db';
import { departments, designations, employees as employeesTable } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { updateEmployeeStatusBasedOnLeave } from '@/lib/utils/employee-status';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// GET handler to find employee by user ID
const getEmployeeByUserIdHandler = async (
  request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } },
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) => {
  try {
    let resolvedParams;
    if (params instanceof Promise) {
      try {
        resolvedParams = await params;
      } catch (error) {
        console.error('Error resolving route parameters:', error);
        return NextResponse.json({ error: 'Failed to resolve route parameters' }, { status: 500 });
      }
    } else {
      resolvedParams = params;
    }

    if (!resolvedParams || !resolvedParams.userId) {
      console.error('Invalid route parameters:', resolvedParams);
      return NextResponse.json({ error: 'Invalid route parameters' }, { status: 400 });
    }

    const { userId } = resolvedParams;
    const userIdNum = parseInt(userId);

    if (!userIdNum) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Find employee by userId field
    const employeeRows = await db
      .select({
        id: employeesTable.id,
        file_number: employeesTable.fileNumber,
        first_name: employeesTable.firstName,
        middle_name: employeesTable.middleName,
        last_name: employeesTable.lastName,
        email: employeesTable.email,
        phone: employeesTable.phone,
        employee_id: employeesTable.id,
        department_id: employeesTable.departmentId,
        designation_id: employeesTable.designationId,
        status: employeesTable.status,
        hire_date: employeesTable.hireDate,
        basic_salary: employeesTable.basicSalary,
        nationality: employeesTable.nationality,
        hourly_rate: employeesTable.hourlyRate,
        overtime_rate_multiplier: employeesTable.overtimeRateMultiplier,
        overtime_fixed_rate: employeesTable.overtimeFixedRate,
        contract_days_per_month: employeesTable.contractDaysPerMonth,
        contract_hours_per_day: employeesTable.contractHoursPerDay,
        date_of_birth: employeesTable.dateOfBirth,
        address: employeesTable.address,
        city: employeesTable.city,
        state: employeesTable.state,
        postal_code: employeesTable.postalCode,
        country: employeesTable.country,
        emergency_contact_name: employeesTable.emergencyContactName,
        emergency_contact_phone: employeesTable.emergencyContactPhone,
        emergency_contact_relationship: employeesTable.emergencyContactRelationship,
        iqama_number: employeesTable.iqamaNumber,
        iqama_expiry: employeesTable.iqamaExpiry,
        passport_number: employeesTable.passportNumber,
        passport_expiry: employeesTable.passportExpiry,
        driving_license_number: employeesTable.drivingLicenseNumber,
        driving_license_expiry: employeesTable.drivingLicenseExpiry,
        operator_license_number: employeesTable.operatorLicenseNumber,
        operator_license_expiry: employeesTable.operatorLicenseExpiry,
        tuv_certification_number: employeesTable.tuvCertificationNumber,
        tuv_certification_expiry: employeesTable.tuvCertificationExpiry,
        spsp_license_number: employeesTable.spspLicenseNumber,
        spsp_license_expiry: employeesTable.spspLicenseExpiry,
        notes: employeesTable.notes,
        current_location: employeesTable.currentLocation,
        food_allowance: employeesTable.foodAllowance,
        housing_allowance: employeesTable.housingAllowance,
        transport_allowance: employeesTable.transportAllowance,
        supervisor: employeesTable.supervisor,
        supervisor_id: employeesTable.supervisor,
        iqama_file: employeesTable.iqamaFile,
        passport_file: employeesTable.passportFile,
        driving_license_file: employeesTable.drivingLicenseFile,
        operator_license_file: employeesTable.operatorLicenseFile,
        tuv_certification_file: employeesTable.tuvCertificationFile,
        spsp_license_file: employeesTable.spspLicenseFile,
        dept_name: departments.name,
        desig_name: designations.name,
      })
      .from(employeesTable)
      .leftJoin(departments, eq(departments.id, employeesTable.departmentId))
      .leftJoin(designations, eq(designations.id, employeesTable.designationId))
      .where(eq(employeesTable.userId, userIdNum));

    if (employeeRows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No employee record found for this user' 
      }, { status: 404 });
    }

    const employee = employeeRows[0];

    // Fetch supervisor details if supervisor exists
    let supervisorDetails = null;
    if (employee.supervisor) {
      try {
        const supervisorRows = await db
          .select({
            id: employeesTable.id,
            first_name: employeesTable.firstName,
            last_name: employeesTable.lastName,
            file_number: employeesTable.fileNumber,
          })
          .from(employeesTable)
          .where(eq(employeesTable.id, parseInt(employee.supervisor)))
          .limit(1);
        
        if (supervisorRows.length > 0) {
          supervisorDetails = supervisorRows[0];
        }
      } catch (error) {
        console.error('Error fetching supervisor details:', error);
        // Continue without supervisor details if there's an error
      }
    }

    // Update employee status based on current leave status
    await updateEmployeeStatusBasedOnLeave(employee.id);

    // Fetch updated employee data after status update
    const updatedEmployeeRows = await db
      .select({
        id: employeesTable.id,
        file_number: employeesTable.fileNumber,
        first_name: employeesTable.firstName,
        middle_name: employeesTable.middleName,
        last_name: employeesTable.lastName,
        email: employeesTable.email,
        phone: employeesTable.phone,
        employee_id: employeesTable.id,
        department_id: employeesTable.departmentId,
        designation_id: employeesTable.designationId,
        status: employeesTable.status,
        hire_date: employeesTable.hireDate,
        basic_salary: employeesTable.basicSalary,
        nationality: employeesTable.nationality,
        hourly_rate: employeesTable.hourlyRate,
        overtime_rate_multiplier: employeesTable.overtimeRateMultiplier,
        overtime_fixed_rate: employeesTable.overtimeFixedRate,
        contract_days_per_month: employeesTable.contractDaysPerMonth,
        contract_hours_per_day: employeesTable.contractHoursPerDay,
        date_of_birth: employeesTable.dateOfBirth,
        address: employeesTable.address,
        city: employeesTable.city,
        state: employeesTable.state,
        postal_code: employeesTable.postalCode,
        country: employeesTable.country,
        emergency_contact_name: employeesTable.emergencyContactName,
        emergency_contact_phone: employeesTable.emergencyContactPhone,
        emergency_contact_relationship: employeesTable.emergencyContactRelationship,
        iqama_number: employeesTable.iqamaNumber,
        iqama_expiry: employeesTable.iqamaExpiry,
        passport_number: employeesTable.passportNumber,
        passport_expiry: employeesTable.passportExpiry,
        driving_license_number: employeesTable.drivingLicenseNumber,
        driving_license_expiry: employeesTable.drivingLicenseExpiry,
        operator_license_number: employeesTable.operatorLicenseNumber,
        operator_license_expiry: employeesTable.operatorLicenseExpiry,
        tuv_certification_number: employeesTable.tuvCertificationNumber,
        tuv_certification_expiry: employeesTable.tuvCertificationExpiry,
        spsp_license_number: employeesTable.spspLicenseNumber,
        spsp_license_expiry: employeesTable.spspLicenseExpiry,
        notes: employeesTable.notes,
        current_location: employeesTable.currentLocation,
        food_allowance: employeesTable.foodAllowance,
        housing_allowance: employeesTable.housingAllowance,
        transport_allowance: employeesTable.transportAllowance,
        supervisor: employeesTable.supervisor,
        iqama_file: employeesTable.iqamaFile,
        passport_file: employeesTable.passportFile,
        driving_license_file: employeesTable.drivingLicenseFile,
        operator_license_file: employeesTable.operatorLicenseFile,
        tuv_certification_file: employeesTable.tuvCertificationFile,
        spsp_license_file: employeesTable.spspLicenseFile,
        dept_name: departments.name,
        desig_name: designations.name,
      })
      .from(employeesTable)
      .leftJoin(departments, eq(departments.id, employeesTable.departmentId))
      .leftJoin(designations, eq(designations.id, employeesTable.designationId))
      .where(eq(employeesTable.userId, userIdNum));

    if (updatedEmployeeRows.length === 0) {
      return NextResponse.json(
        { error: 'Employee not found after status update' },
        { status: 404 }
      );
    }

    const updatedEmployee = updatedEmployeeRows[0];

    if (!updatedEmployee) {
      return NextResponse.json(
        { error: 'Employee not found after status update' },
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
      employee_id: updatedEmployee.id,
      department: updatedEmployee.dept_name
        ? { id: updatedEmployee.department_id, name: updatedEmployee.dept_name }
        : null,
      designation: updatedEmployee.desig_name
        ? { id: updatedEmployee.designation_id, name: updatedEmployee.desig_name }
        : null,
      status: updatedEmployee.status,
      hire_date: updatedEmployee.hire_date ? updatedEmployee.hire_date.slice(0, 10) : null,
      basic_salary: updatedEmployee.basic_salary,
      nationality: updatedEmployee.nationality,
      hourly_rate: updatedEmployee.hourly_rate,
      overtime_rate_multiplier: updatedEmployee.overtime_rate_multiplier,
      overtime_fixed_rate: updatedEmployee.overtime_fixed_rate,
      contract_days_per_month: updatedEmployee.contract_days_per_month,
      contract_hours_per_day: updatedEmployee.contract_hours_per_day,
      date_of_birth: updatedEmployee.date_of_birth
        ? updatedEmployee.date_of_birth.slice(0, 10)
        : null,
      address: updatedEmployee.address,
      city: updatedEmployee.city,
      state: updatedEmployee.state,
      postal_code: updatedEmployee.postal_code,
      country: updatedEmployee.country,
      emergency_contact_name: updatedEmployee.emergency_contact_name,
      emergency_contact_phone: updatedEmployee.emergency_contact_phone,
      emergency_contact_relationship: updatedEmployee.emergency_contact_relationship,
      iqama_number: updatedEmployee.iqama_number,
      iqama_expiry: updatedEmployee.iqama_expiry ? updatedEmployee.iqama_expiry.slice(0, 10) : null,
      passport_number: updatedEmployee.passport_number,
      passport_expiry: updatedEmployee.passport_expiry
        ? updatedEmployee.passport_expiry.slice(0, 10)
        : null,
      driving_license_number: updatedEmployee.driving_license_number,
      driving_license_expiry: updatedEmployee.driving_license_expiry
        ? updatedEmployee.driving_license_expiry.slice(0, 10)
        : null,
      operator_license_number: updatedEmployee.operator_license_number,
      operator_license_expiry: updatedEmployee.operator_license_expiry
        ? updatedEmployee.operator_license_expiry.slice(0, 10)
        : null,
      tuv_certification_number: updatedEmployee.tuv_certification_number,
      tuv_certification_expiry: updatedEmployee.tuv_certification_expiry
        ? updatedEmployee.tuv_certification_expiry.slice(0, 10)
        : null,
      spsp_license_number: updatedEmployee.spsp_license_number,
      spsp_license_expiry: updatedEmployee.spsp_license_expiry
        ? updatedEmployee.spsp_license_expiry.slice(0, 10)
        : null,
      notes: updatedEmployee.notes,
      current_location: updatedEmployee.current_location,
      food_allowance: updatedEmployee.food_allowance,
      housing_allowance: updatedEmployee.housing_allowance,
      transport_allowance: updatedEmployee.transport_allowance,
      supervisor: updatedEmployee.supervisor,
      supervisor_details: supervisorDetails ? {
        id: supervisorDetails.id,
        name: `${supervisorDetails.first_name} ${supervisorDetails.last_name}`,
        file_number: supervisorDetails.file_number,
      } : null,
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
      message: 'Employee retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching employee by user ID:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch employee: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
};

// Export the wrapped handler
export const GET = withPermission(PermissionConfigs.employee.read)(getEmployeeByUserIdHandler);
