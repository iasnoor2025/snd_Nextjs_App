import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { users as usersTable, employees as employeesTable, departments as departmentsTable, designations as designationsTable } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

// GET /api/user/first-login-check - Check if this is first login and establish employee relationship
export async function GET(_request: NextRequest) {
  return await POST(_request);
}

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          error: 'Not authenticated',
          hasNationId: false,
          nationId: null,
          userId: null,
          userName: null,
          userEmail: null,
          matchedEmployee: null,
          isFirstLogin: false
        },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    const userId = parseInt(session.user.id);
    
    // Get user data
    const userRows = await db
      .select({
        id: usersTable.id,
        national_id: usersTable.nationalId,
        name: usersTable.name,
        email: usersTable.email,
        created_at: usersTable.createdAt,
        updated_at: usersTable.updatedAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    const user = userRows[0];

    if (!user) {
      return NextResponse.json(
        { 
          error: 'User not found',
          hasNationId: false,
          nationId: null,
          userId: null,
          userName: null,
          userEmail: null,
          matchedEmployee: null,
          isFirstLogin: false
        },
        { 
          status: 404,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    // Check if user already has a national_id - if yes, not first login
    if (user.national_id) {
      // User already has Nation ID, just return the data
      let matchedEmployee: any = null;
      try {
        const employeeRows = await db
          .select({
            id: employeesTable.id,
            first_name: employeesTable.firstName,
            middle_name: employeesTable.middleName,
            last_name: employeesTable.lastName,
            file_number: employeesTable.fileNumber,
            phone: employeesTable.phone,
            email: employeesTable.email,
            address: employeesTable.address,
            city: employeesTable.city,
            state: employeesTable.state,
            country: employeesTable.country,
            nationality: employeesTable.nationality,
            date_of_birth: employeesTable.dateOfBirth,
            hire_date: employeesTable.hireDate,
            designation_id: employeesTable.designationId,
            department_id: employeesTable.departmentId,
            iqama_number: employeesTable.iqamaNumber,
            iqama_expiry: employeesTable.iqamaExpiry,
            passport_number: employeesTable.passportNumber,
            passport_expiry: employeesTable.passportExpiry,
            driving_license_number: employeesTable.drivingLicenseNumber,
            driving_license_expiry: employeesTable.drivingLicenseExpiry,
            operator_license_number: employeesTable.operatorLicenseNumber,
            operator_license_expiry: employeesTable.operatorLicenseExpiry,
          })
          .from(employeesTable)
          .where(eq(employeesTable.iqamaNumber, user.national_id))
          .limit(1);

        if (employeeRows[0]) {
          const employee = employeeRows[0];
          
          // Get designation and department names
          let designationName: string | null = null;
          let departmentName: string | null = null;
          
          if (employee.designation_id) {
            const designationRows = await db
              .select({ name: designationsTable.name })
              .from(designationsTable)
              .where(eq(designationsTable.id, employee.designation_id))
              .limit(1);
            designationName = designationRows[0]?.name;
          }
          
          if (employee.department_id) {
            const departmentRows = await db
              .select({ name: departmentsTable.name })
              .from(departmentsTable)
              .where(eq(departmentsTable.id, employee.department_id))
              .limit(1);
            departmentName = departmentRows[0]?.name;
          }

          matchedEmployee = {
            ...employee,
            designation: { name: designationName },
            department: { name: departmentName }
          };
        }
      } catch (employeeError) {
        console.error('Error fetching matched employee:', employeeError);
      }

      return NextResponse.json({
        hasNationId: true,
        nationId: user.national_id,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        matchedEmployee: matchedEmployee,
        isFirstLogin: false
      });
    }

    // This is first login - check if user email matches any employee
    let matchedEmployee: any = null;
    let isFirstLogin = true;

    if (user.email) {
      try {
        // First try to find employee by email match
        const employeeRows = await db
          .select({
            id: employeesTable.id,
            first_name: employeesTable.firstName,
            middle_name: employeesTable.middleName,
            last_name: employeesTable.lastName,
            file_number: employeesTable.fileNumber,
            phone: employeesTable.phone,
            email: employeesTable.email,
            address: employeesTable.address,
            city: employeesTable.city,
            state: employeesTable.state,
            country: employeesTable.country,
            nationality: employeesTable.nationality,
            date_of_birth: employeesTable.dateOfBirth,
            hire_date: employeesTable.hireDate,
            designation_id: employeesTable.designationId,
            department_id: employeesTable.departmentId,
            iqama_number: employeesTable.iqamaNumber,
            iqama_expiry: employeesTable.iqamaExpiry,
            passport_number: employeesTable.passportNumber,
            passport_expiry: employeesTable.passportExpiry,
            driving_license_number: employeesTable.drivingLicenseNumber,
            driving_license_expiry: employeesTable.drivingLicenseExpiry,
            operator_license_number: employeesTable.operatorLicenseNumber,
            operator_license_expiry: employeesTable.operatorLicenseExpiry,
          })
          .from(employeesTable)
          .where(eq(employeesTable.email, user.email))
          .limit(1);

        if (employeeRows[0]) {
          const employee = employeeRows[0];
          
          // Get designation and department names
          let designationName: string | null = null;
          let departmentName: string | null = null;
          
          if (employee.designation_id) {
            const designationRows = await db
              .select({ name: designationsTable.name })
              .from(designationsTable)
              .where(eq(designationsTable.id, employee.designation_id))
              .limit(1);
            designationName = designationRows[0]?.name;
          }
          
          if (employee.department_id) {
            const departmentRows = await db
              .select({ name: departmentsTable.name })
              .from(departmentsTable)
              .where(eq(departmentsTable.id, employee.department_id))
              .limit(1);
            departmentName = departmentRows[0]?.name;
          }

          matchedEmployee = {
            ...employee,
            designation: { name: designationName },
            department: { name: departmentName }
          };

          // If found by email, update employee email to match user email and set national_id
          try {
            // Update employee email if different
            if (employee.email !== user.email) {
              await db
                .update(employeesTable)
                .set({ email: user.email })
                .where(eq(employeesTable.id, employee.id));
              console.log('✅ Updated employee email to match user email');
            }

            // Update user's national_id to match employee's iqama_number
            await db
              .update(usersTable)
              .set({ nationalId: employee.iqama_number })
              .where(eq(usersTable.id, userId));
            console.log('✅ Updated user national_id to match employee iqama');

            // Update the matchedEmployee object with new email
            matchedEmployee.email = user.email;
          } catch (updateError) {
            console.error('❌ Error updating employee/user relationship:', updateError);
          }
        }
      } catch (employeeError) {
        console.error('Error fetching matched employee:', employeeError);
      }
    }

    const result = {
      hasNationId: !!user.national_id,
      nationId: user.national_id,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      matchedEmployee: matchedEmployee,
      isFirstLogin: isFirstLogin,
    };

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ Error checking first login:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check first login',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}
