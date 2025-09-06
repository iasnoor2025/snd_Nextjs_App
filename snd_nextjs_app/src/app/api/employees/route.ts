import { db } from '@/lib/db';
import {
  advancePayments,
  departments,
  designations,
  employeeAssignments,
  employeeDocuments,
  employeeLeaves,
  employees as employeesTable,
  projects,
  rentals,
  timesheets,
  users as usersTable,
  permissions,
  roleHasPermissions,
  projectManpower,
} from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { updateEmployeeStatusBasedOnLeave } from '@/lib/utils/employee-status';
import { ERPNextSyncService } from '@/lib/services/erpnext-sync-service';
import { and, asc, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/employees - List employees
const getEmployeesHandler = async (request: NextRequest) => {
  try {

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const department = searchParams.get('department') || '';
    const status = searchParams.get('status') || '';
    const supervisor = searchParams.get('supervisor') || '';
    const all = searchParams.get('all') === 'true';

    const skip = (page - 1) * limit;

    // Build filters
    const filters: unknown[] = [];
    if (search) {
      const s = `%${search}%`;
      filters.push(
        or(
          ilike(employeesTable.firstName, s),
          ilike(employeesTable.lastName, s),
          ilike(employeesTable.fileNumber, s),
          ilike(employeesTable.email, s)
        )
      );
    }
    if (department) {
      filters.push(eq(employeesTable.departmentId, parseInt(department)));
    }
    if (status) {
      filters.push(eq(employeesTable.status, status));
    }
    if (supervisor) {
      console.log('Filtering by supervisor:', supervisor);
      filters.push(eq(employeesTable.supervisor, supervisor));
    }

    // No employee filtering - all authenticated users can see all employees

    const whereExpr = filters.length ? and(...filters) : undefined;

    // Simplified query to test
    const baseQuery = db
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
        supervisor: employeesTable.supervisor,
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
      .where(whereExpr)
      .orderBy(asc(employeesTable.firstName));

    const employeeRows = await (!all ? baseQuery.offset(skip).limit(limit) : baseQuery);

    console.log('Employees found:', employeeRows.length);
    if (supervisor) {
      console.log('Supervisor filter applied:', supervisor);
      console.log('Sample employee supervisor values:', employeeRows.slice(0, 3).map(e => ({ id: e.id, supervisor: e.supervisor })));
    }

    const countRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(employeesTable)
      .where(whereExpr);
    const total = Number((countRow as { count: number }[])[0]?.count ?? 0);

    // Update employee statuses based on current leave status
    
    const statusUpdatePromises = employeeRows.map(employee =>
      updateEmployeeStatusBasedOnLeave(employee.id as number)
    );
    await Promise.all(statusUpdatePromises);

    // Fetch latest ACTIVE assignment per employee in this page
    const employeeFileNumbers = employeeRows.map(e => e.file_number as string).filter(Boolean);
    const latestAssignments: Record<string, any> = {};
    if (employeeFileNumbers.length > 0) {
      // If this is a request for all employees (admin view), fetch assignments for all employees
      // Otherwise, only fetch for the current page
      const isAllEmployeesRequest = searchParams.get('all') === 'true';
      
      let assignmentQuery;
      if (isAllEmployeesRequest) {
        // For admin view, get assignments for all employees to ensure statistics are accurate
        assignmentQuery = db
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
          .where(eq(employeeAssignments.status, 'active'))
          .orderBy(desc(employeeAssignments.startDate));
      } else {
        // For paginated view, only get assignments for current page employees
        assignmentQuery = db
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
          .where(
            and(
              inArray(employeesTable.fileNumber, employeeFileNumbers),
              eq(employeeAssignments.status, 'active')
            )
          )
          .orderBy(desc(employeeAssignments.startDate));
      }
      
              const assignmentRows = await assignmentQuery;
        
        // Also fetch project assignments from projectManpower table
        let projectAssignmentQuery;
        if (isAllEmployeesRequest) {
          projectAssignmentQuery = db
            .select({
              id: projectManpower.id,
              employee_file_number: employeesTable.fileNumber,
              type: sql<string>`'project'`,
              name: sql<string>`'Project Assignment'`,
              status: projectManpower.status,
              start_date: projectManpower.startDate,
              end_date: projectManpower.endDate,
              location: sql<string>`NULL`,
              notes: projectManpower.notes,
              project_name: projects.name,
              rental_number: sql<string>`NULL`,
            })
            .from(projectManpower)
            .innerJoin(employeesTable, eq(employeesTable.id, projectManpower.employeeId))
            .leftJoin(projects, eq(projects.id, projectManpower.projectId))
            .where(eq(projectManpower.status, 'active'))
            .orderBy(desc(projectManpower.startDate));
        } else {
          projectAssignmentQuery = db
            .select({
              id: projectManpower.id,
              employee_file_number: employeesTable.fileNumber,
              type: sql<string>`'project'`,
              name: sql<string>`'Project Assignment'`,
              status: projectManpower.status,
              start_date: projectManpower.startDate,
              end_date: projectManpower.endDate,
              location: sql<string>`NULL`,
              notes: projectManpower.notes,
              project_name: projects.name,
              rental_number: sql<string>`NULL`,
            })
            .from(projectManpower)
            .innerJoin(employeesTable, eq(employeesTable.id, projectManpower.employeeId))
            .leftJoin(projects, eq(projects.id, projectManpower.projectId))
            .where(
              and(
                inArray(employeesTable.fileNumber, employeeFileNumbers),
                eq(projectManpower.status, 'active')
              )
            )
            .orderBy(desc(projectManpower.startDate));
        }
        
        const projectAssignmentRows = await projectAssignmentQuery;
        
        // Combine both assignment types
        const allAssignments = [...assignmentRows, ...projectAssignmentRows];
        
        for (const row of allAssignments) {
          const empFileNumber = row.employee_file_number as string;
          if (!latestAssignments[empFileNumber]) {
            latestAssignments[empFileNumber] = row;
          }
        }
    }

    // Transform
    const transformedEmployees = employeeRows.map(employee => {
      const fullName = [employee.first_name, employee.middle_name, employee.last_name]
        .filter(Boolean)
        .join(' ');
      const currentAssignment = latestAssignments[employee.file_number as string] || null;
      const isAssignmentActive =
        currentAssignment &&
        currentAssignment.status === 'active' &&
        (!currentAssignment.end_date ||
          new Date(currentAssignment.end_date as unknown as string) > new Date());
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
        department_details: employee.dept_name ? { name: employee.dept_name } : null,
        designation: employee.desig_name || null,
        designation_details: employee.desig_name ? { name: employee.desig_name } : null,
        hire_date: employee.hire_date || null,
        iqama_number: employee.iqama_number || null,
        iqama_expiry: employee.iqama_expiry || null,
        nationality: employee.nationality || null,
        basic_salary: employee.basic_salary ? Number(employee.basic_salary) : null,
        hourly_rate: employee.hourly_rate ? Number(employee.hourly_rate) : null,
        overtime_rate_multiplier: employee.overtime_rate_multiplier
          ? Number(employee.overtime_rate_multiplier)
          : null,
        overtime_fixed_rate: employee.overtime_fixed_rate
          ? Number(employee.overtime_fixed_rate)
          : null,
        supervisor: employee.supervisor || null,
        current_location: currentAssignment?.location || null,
        current_assignment: isAssignmentActive
          ? {
              id: currentAssignment.id,
              type: currentAssignment.type,
              name:
                currentAssignment.name ||
                currentAssignment.project_name ||
                currentAssignment.rental_number ||
                'Unnamed Assignment',
              location: currentAssignment.location || null,
              start_date: currentAssignment.start_date
                ? new Date(currentAssignment.start_date as unknown as string).toISOString()
                : null,
              end_date: currentAssignment.end_date
                ? new Date(currentAssignment.end_date as unknown as string).toISOString()
                : null,
              status: currentAssignment.status,
              notes: currentAssignment.notes,
              project: currentAssignment.project_name
                ? { name: currentAssignment.project_name }
                : null,
              rental: currentAssignment.rental_number
                ? { rental_number: currentAssignment.rental_number }
                : null,
            }
          : null,
        user: employee.user_id
          ? {
              id: employee.user_id,
              name: employee.user_name,
              email: employee.user_email,
              isActive: employee.user_is_active,
            }
          : null,
      };
    });

    const employeesWithAssignments = transformedEmployees.filter(emp => emp.current_assignment);

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

    return NextResponse.json(response);
  } catch (error) {
    console.error('Employees API - Error fetching employees:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
};

// POST /api/employees - Create new employee
const createEmployeeHandler = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const {
      first_name,
      last_name,
      middle_name,
      fileNumber,
      email,
      phone,
      nationality,
      date_of_birth,
      hire_date,
      address,
      city,
      state,
      postal_code,
      country,
      department_id,
      designation_id,
      supervisor,
      status,
      basic_salary,
      food_allowance,
      housing_allowance,
      transport_allowance,
      hourly_rate,
      absent_deduction_rate,
      overtime_rate_multiplier,
      overtime_fixed_rate,
      bank_name,
      bank_account_number,
      bank_iban,
      contract_hours_per_day,
      contract_days_per_month,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      notes,
      iqama_number,
      iqama_expiry,
      iqama_cost,
      passport_number,
      passport_expiry,
      driving_license_number,
      driving_license_expiry,
      driving_license_cost,
      operator_license_number,
      operator_license_expiry,
      operator_license_cost,
      tuv_certification_number,
      tuv_certification_expiry,
      tuv_certification_cost,
      spsp_license_number,
      spsp_license_expiry,
      spsp_license_cost,
      is_operator,
      access_start_date,
      access_end_date,
      access_restriction_reason,
      // File URLs
      driving_license_file,
      operator_license_file,
      tuv_certification_file,
      spsp_license_file,
      passport_file,
      iqama_file,
    } = body;

    if (!first_name || !last_name || !fileNumber) {
      return NextResponse.json(
        { error: 'First name, last name, and file number are required' },
        { status: 400 }
      );
    }

    // Check if file number already exists
    const existing = await db
      .select({ id: employeesTable.id })
      .from(employeesTable)
      .where(eq(employeesTable.fileNumber, fileNumber))
      .limit(1);
    const existingEmployee = existing[0];

    if (existingEmployee) {
      return NextResponse.json({ error: 'Employee file number already exists' }, { status: 409 });
    }

    // Create new employee with all fields
    const inserted = await db
      .insert(employeesTable)
      .values({
        firstName: first_name,
        middleName: middle_name || null,
        lastName: last_name,
        fileNumber: fileNumber,
        email: email || null,
        phone: phone || null,
        nationality: nationality || null,
        dateOfBirth: date_of_birth ? new Date(date_of_birth).toISOString() : null,
        hireDate: hire_date ? new Date(hire_date).toISOString() : null,
        address: address || null,
        city: city || null,
        state: state || null,
        postalCode: postal_code || null,
        country: country || null,
        departmentId: department_id ? parseInt(department_id) : null,
        designationId: designation_id ? parseInt(designation_id) : null,
        supervisor: supervisor || null,
        status: status || 'active',
        basicSalary: basic_salary ? String(parseFloat(basic_salary)) : '0',
        foodAllowance: food_allowance ? String(parseFloat(food_allowance)) : '0',
        housingAllowance: housing_allowance ? String(parseFloat(housing_allowance)) : '0',
        transportAllowance: transport_allowance ? String(parseFloat(transport_allowance)) : '0',
        hourlyRate: hourly_rate ? parseFloat(hourly_rate) : null,
        absentDeductionRate: absent_deduction_rate ? String(parseFloat(absent_deduction_rate)) : '0',
        overtimeRateMultiplier: overtime_rate_multiplier ? String(parseFloat(overtime_rate_multiplier)) : '1.5',
        overtimeFixedRate: overtime_fixed_rate ? String(parseFloat(overtime_fixed_rate)) : null,
        bankName: bank_name || null,
        bankAccountNumber: bank_account_number || null,
        bankIban: bank_iban || null,
        contractHoursPerDay: contract_hours_per_day ? parseInt(contract_hours_per_day) : 8,
        contractDaysPerMonth: contract_days_per_month ? parseInt(contract_days_per_month) : 30,
        emergencyContactName: emergency_contact_name || null,
        emergencyContactPhone: emergency_contact_phone || null,
        emergencyContactRelationship: emergency_contact_relationship || null,
        notes: notes || null,
        iqamaNumber: iqama_number || null,
        iqamaExpiry: iqama_expiry ? new Date(iqama_expiry).toISOString() : null,
        iqamaCost: iqama_cost ? String(parseFloat(iqama_cost)) : null,
        passportNumber: passport_number || null,
        passportExpiry: passport_expiry ? new Date(passport_expiry).toISOString() : null,
        drivingLicenseNumber: driving_license_number || null,
        drivingLicenseExpiry: driving_license_expiry ? new Date(driving_license_expiry).toISOString() : null,
        drivingLicenseCost: driving_license_cost ? String(parseFloat(driving_license_cost)) : null,
        operatorLicenseNumber: operator_license_number || null,
        operatorLicenseExpiry: operator_license_expiry ? new Date(operator_license_expiry).toISOString() : null,
        operatorLicenseCost: operator_license_cost ? String(parseFloat(operator_license_cost)) : null,
        tuvCertificationNumber: tuv_certification_number || null,
        tuvCertificationExpiry: tuv_certification_expiry ? new Date(tuv_certification_expiry).toISOString() : null,
        tuvCertificationCost: tuv_certification_cost ? String(parseFloat(tuv_certification_cost)) : null,
        spspLicenseNumber: spsp_license_number || null,
        spspLicenseExpiry: spsp_license_expiry ? new Date(spsp_license_expiry).toISOString() : null,
        spspLicenseCost: spsp_license_cost ? String(parseFloat(spsp_license_cost)) : null,
        isOperator: is_operator || false,
        accessStartDate: access_start_date ? new Date(access_start_date).toISOString() : null,
        accessEndDate: access_end_date ? new Date(access_end_date).toISOString() : null,
        accessRestrictionReason: access_restriction_reason || null,
        // File URLs
        drivingLicenseFile: driving_license_file || null,
        operatorLicenseFile: operator_license_file || null,
        tuvCertificationFile: tuv_certification_file || null,
        spspLicenseFile: spsp_license_file || null,
        passportFile: passport_file || null,
        iqamaFile: iqama_file || null,
        updatedAt: new Date().toISOString(),
      })
      .returning();
    const employee = (inserted as any[])[0];

    // Attempt ERPNext sync using the service
    const erpnextSyncService = ERPNextSyncService.getInstance();
    let erpnextSyncResult = null;
    
    if (erpnextSyncService.isAvailable()) {
      erpnextSyncResult = await erpnextSyncService.syncNewEmployee(employee);
      
      // If sync was successful, update the local employee record with the ERPNext ID
      if (erpnextSyncResult.success && erpnextSyncResult.erpnextId) {
        await db
          .update(employeesTable)
          .set({ erpnextId: erpnextSyncResult.erpnextId })
          .where(eq(employeesTable.id, employee.id));
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Employee created successfully',
        employee,
        erpnextSync: erpnextSyncResult,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
};

// Export the wrapped handlers
export const GET = withPermission(PermissionConfigs.employee.read)(getEmployeesHandler);
export const POST = withPermission(PermissionConfigs.employee.create)(createEmployeeHandler);
