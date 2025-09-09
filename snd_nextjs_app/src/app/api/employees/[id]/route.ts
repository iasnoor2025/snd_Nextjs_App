import { db } from '@/lib/db';
import { departments, designations, employees as employeesTable } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { updateEmployeeStatusBasedOnLeave } from '@/lib/utils/employee-status';
import { ERPNextSyncService } from '@/lib/services/erpnext-sync-service';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// GET handler with employee data filtering
const getEmployeeHandler = async (
  request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } },
  { params }: { params: Promise<{ id: string }> | { id: string } }
) => {
  try {
    let resolvedParams;
    if (params instanceof Promise) {
      try {
        resolvedParams = await params;
      } catch (error) {
        
        return NextResponse.json({ error: 'Failed to resolve route parameters' }, { status: 500 });
      }
    } else {
      resolvedParams = params;
    }

    if (!resolvedParams || !resolvedParams.id) {
      
      return NextResponse.json({ error: 'Invalid route parameters' }, { status: 400 });
    }

    const { id } = resolvedParams;
    const employeeId = parseInt(id);

    if (!employeeId) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    // For employee users, ensure they can only access their own employee record
    if (request.employeeAccess?.ownEmployeeId) {
      if (employeeId !== request.employeeAccess.ownEmployeeId) {
        return NextResponse.json(
          { error: 'You can only access your own employee record' },
          { status: 403 }
        );
      }
    }

    // Fetch employee data from database using Drizzle
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
      .where(eq(employeesTable.id, employeeId));

    if (employeeRows.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Fetch supervisor details if supervisor exists
    let supervisorDetails = null;
    if (employeeRows[0].supervisor) {
      try {
        const supervisorRows = await db
          .select({
            id: employeesTable.id,
            first_name: employeesTable.firstName,
            last_name: employeesTable.lastName,
            file_number: employeesTable.fileNumber,
          })
          .from(employeesTable)
          .where(eq(employeesTable.id, parseInt(employeeRows[0].supervisor)))
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
    await updateEmployeeStatusBasedOnLeave(employeeId);

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
      .where(eq(employeesTable.id, employeeId));

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
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch employee: ' + (error as Error).message,
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
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    // For employee users, ensure they can only update their own employee record
    if (request.employeeAccess?.ownEmployeeId) {
      if (employeeId !== request.employeeAccess.ownEmployeeId) {
        return NextResponse.json(
          { error: 'You can only update your own employee record' },
          { status: 403 }
        );
      }
    }

    // Build partial update payload: only mutate fields present in body
    const updateDataRaw: Record<string, any> = body || {};
    const drizzleData: Record<string, any> = {};

    // Debug logging
    console.log('Update request body:', body);
    console.log('Employee ID:', employeeId);

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
        drizzleData[
          key === 'hire_date'
            ? 'hireDate'
            : key === 'date_of_birth'
              ? 'dateOfBirth'
              : key === 'iqama_expiry'
                ? 'iqamaExpiry'
                : key === 'passport_expiry'
                  ? 'passportExpiry'
                  : key === 'driving_license_expiry'
                    ? 'drivingLicenseExpiry'
                    : key === 'operator_license_expiry'
                      ? 'operatorLicenseExpiry'
                      : key === 'tuv_certification_expiry'
                        ? 'tuvCertificationExpiry'
                        : 'spspLicenseExpiry'
        ] = v && typeof v === 'string' && v.trim() !== '' ? v : null;
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
        drizzleData[
          key === 'hourly_rate'
            ? 'hourlyRate'
            : key === 'basic_salary'
              ? 'basicSalary'
              : key === 'overtime_rate_multiplier'
                ? 'overtimeRateMultiplier'
                : 'overtimeFixedRate'
        ] = v === '' || v === null || v === undefined ? null : v;
      }
    }

    const numberFieldsInt = ['contract_days_per_month', 'contract_hours_per_day'];
    for (const key of numberFieldsInt) {
      if (Object.prototype.hasOwnProperty.call(updateDataRaw, key)) {
        const v = updateDataRaw[key];
        drizzleData[
          key === 'contract_days_per_month' ? 'contractDaysPerMonth' : 'contractHoursPerDay'
        ] = v === '' || v === null || v === undefined ? null : parseInt(v);
      }
    }

    // Pass-through other primitive fields if present
    const passthroughFields = [
      'first_name',
      'middle_name',
      'last_name',
      'email',
      'phone',
      'file_number',
      'address',
      'city',
      'state',
      'postal_code',
      'country',
      'nationality',
      'department_id',
      'designation_id',
      'supervisor',
      'status',
      'notes',
      'iqama_number',
      'passport_number',
      'driving_license_number',
      'operator_license_number',
      'tuv_certification_number',
      'spsp_license_number',
    ];
    for (const key of passthroughFields) {
      if (Object.prototype.hasOwnProperty.call(updateDataRaw, key)) {
        const drizzleKey =
          key === 'first_name'
            ? 'firstName'
            : key === 'middle_name'
              ? 'middleName'
            : key === 'last_name'
              ? 'lastName'
            : key === 'file_number'
              ? 'fileNumber'
            : key === 'postal_code'
              ? 'postalCode'
            : key === 'department_id'
              ? 'departmentId'
            : key === 'designation_id'
              ? 'designationId'
            : key === 'iqama_number'
              ? 'iqamaNumber'
            : key === 'passport_number'
              ? 'passportNumber'
            : key === 'driving_license_number'
              ? 'drivingLicenseNumber'
            : key === 'operator_license_number'
              ? 'operatorLicenseNumber'
            : key === 'tuv_certification_number'
              ? 'tuvCertificationNumber'
            : key === 'spsp_license_number'
              ? 'spspLicenseNumber'
            : key;
        drizzleData[drizzleKey] = updateDataRaw[key];
      }
    }

    // Auto-calc hourly_rate only if basic_salary and contract fields are part of this update
    if (
      Object.prototype.hasOwnProperty.call(drizzleData, 'basicSalary') &&
      drizzleData.basicSalary &&
      (Object.prototype.hasOwnProperty.call(drizzleData, 'contractDaysPerMonth') ||
        Object.prototype.hasOwnProperty.call(drizzleData, 'contractHoursPerDay'))
    ) {
              const days = drizzleData.contractDaysPerMonth ?? 30;
      const hours = drizzleData.contractHoursPerDay ?? 8;
      if (days > 0 && hours > 0) {
        drizzleData.hourlyRate =
          Math.round((Number(drizzleData.basicSalary) / (days * hours)) * 100) / 100;
      }
    }

    // Debug logging
    console.log('Drizzle update data:', drizzleData);

    // Update employee in database using Drizzle
    const updatedEmployeeRows = await db
      .update(employeesTable)
      .set({
        ...drizzleData,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(employeesTable.id, employeeId))
      .returning();

    if (updatedEmployeeRows.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const updatedEmployee = updatedEmployeeRows[0];

    if (!updatedEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Fetch updated employee with department and designation info
    const employeeWithRelations = await db
      .select({
        id: employeesTable.id,
        first_name: employeesTable.firstName,
        last_name: employeesTable.lastName,
        dept_name: departments.name,
        desig_name: designations.name,
      })
      .from(employeesTable)
      .leftJoin(departments, eq(departments.id, employeesTable.departmentId))
      .leftJoin(designations, eq(designations.id, employeesTable.designationId))
      .where(eq(employeesTable.id, employeeId));

    const employeeWithDept = employeeWithRelations[0];

    // Attempt ERPNext sync using the service
    const erpnextSyncService = ERPNextSyncService.getInstance();
    let erpnextSyncResult = null;
    
    if (erpnextSyncService.isAvailable()) {
      erpnextSyncResult = await erpnextSyncService.syncUpdatedEmployee(
        updatedEmployee,
        employeeWithDept?.dept_name || undefined,
        employeeWithDept?.desig_name || undefined
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Employee updated successfully',
      employee: {
        ...updatedEmployee,
        department: employeeWithDept?.dept_name
          ? { id: updatedEmployee.departmentId, name: employeeWithDept.dept_name }
          : null,
        designation: employeeWithDept?.desig_name
          ? { id: updatedEmployee.designationId, name: employeeWithDept.desig_name }
          : null,
      },
      erpnextSync: erpnextSyncResult,
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update employee: ' + (error as Error).message,
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
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    // For employee users, ensure they can only delete their own employee record
    if (request.employeeAccess?.ownEmployeeId) {
      if (employeeId !== request.employeeAccess.ownEmployeeId) {
        return NextResponse.json(
          { error: 'You can only delete your own employee record' },
          { status: 403 }
        );
      }
    }

    // Get employee data before deletion for ERPNext sync
    const employeeToDelete = await db
      .select()
      .from(employeesTable)
      .where(eq(employeesTable.id, employeeId))
      .limit(1);

    if (employeeToDelete.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Soft delete employee using Drizzle
    await db
      .update(employeesTable)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(employeesTable.id, employeeId));

    // Attempt ERPNext sync to mark employee as inactive
    const erpnextSyncService = ERPNextSyncService.getInstance();
    let erpnextSyncResult = null;
    
    if (erpnextSyncService.isAvailable()) {
      erpnextSyncResult = await erpnextSyncService.syncDeletedEmployee(employeeToDelete[0]);
    }

    return NextResponse.json({
      success: true,
      message: 'Employee deleted successfully',
      erpnextSync: erpnextSyncResult,
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete employee: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
};

// Export the wrapped handlers
export const GET = withPermission(PermissionConfigs.employee.read)(getEmployeeHandler);
export const PUT = withPermission(PermissionConfigs.employee.update)(updateEmployeeHandler);
export const DELETE = withPermission(PermissionConfigs.employee.delete)(deleteEmployeeHandler);
