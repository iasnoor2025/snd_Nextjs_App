import { db } from '@/lib/db';
import { users as usersTable, roles as rolesTable, modelHasRoles as modelHasRolesTable, employees as employeesTable, departments, designations } from '@/lib/drizzle/schema';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth-config';
import { eq } from 'drizzle-orm';

// GET /api/auth/me - Get current user's role
export async function GET() {
  try {
    // Get the current session
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Find the current user
    const currentUser = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
        role_id: usersTable.roleId,
      })
      .from(usersTable)
      .where(eq(usersTable.email, session.user.email))
      .limit(1);

    if (!currentUser[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = currentUser[0];

    // Determine role based on user_roles or fallback to role_id
    let role = 'USER';

    // Check if user has entries in modelHasRoles
    const userRoles = await db
      .select({
        role_id: rolesTable.id,
        role_name: rolesTable.name,
      })
      .from(modelHasRolesTable)
      .leftJoin(rolesTable, eq(rolesTable.id, modelHasRolesTable.roleId))
      .where(eq(modelHasRolesTable.userId, user.id));

    if (userRoles.length > 0 && userRoles[0]?.role_name) {
      // Use the first role found
      role = userRoles[0].role_name.toUpperCase();
    } else {
      // Fallback: If no user_roles found, try to get role from the roles table using role_id
      if (user.role_id) {
        const roleRecord = await db
          .select({ name: rolesTable.name })
          .from(rolesTable)
          .where(eq(rolesTable.id, user.role_id))
          .limit(1);
        
        if (roleRecord[0]?.name) {
          role = roleRecord[0].name.toUpperCase();
        }
      }
    }

    // Try to fetch employee data for this user
    let employeeData = null;
    try {
      const employeeRows = await db
        .select({
          id: employeesTable.id,
          file_number: employeesTable.fileNumber,
          first_name: employeesTable.firstName,
          middle_name: employeesTable.middleName,
          last_name: employeesTable.lastName,
          email: employeesTable.email,
          phone: employeesTable.phone,
          department_id: employeesTable.departmentId,
          designation_id: employeesTable.designationId,
          status: employeesTable.status,
          hire_date: employeesTable.hireDate,
          basic_salary: employeesTable.basicSalary,
          nationality: employeesTable.nationality,
          hourly_rate: employeesTable.hourlyRate,
          current_location: employeesTable.currentLocation,
          dept_name: departments.name,
          desig_name: designations.name,
        })
        .from(employeesTable)
        .leftJoin(departments, eq(departments.id, employeesTable.departmentId))
        .leftJoin(designations, eq(designations.id, employeesTable.designationId))
        .where(eq(employeesTable.userId, user.id))
        .limit(1);

      if (employeeRows.length > 0) {
        const emp = employeeRows[0];
        employeeData = {
          id: emp.id,
          file_number: emp.file_number,
          first_name: emp.first_name,
          middle_name: emp.middle_name,
          last_name: emp.last_name,
          full_name: `${emp.first_name} ${emp.middle_name ? emp.middle_name + ' ' : ''}${emp.last_name}`,
          email: emp.email,
          phone: emp.phone,
          department: emp.dept_name ? { id: emp.department_id, name: emp.dept_name } : null,
          designation: emp.desig_name ? { id: emp.designation_id, name: emp.desig_name } : null,
          status: emp.status,
          hire_date: emp.hire_date ? emp.hire_date.slice(0, 10) : null,
          basic_salary: emp.basic_salary,
          nationality: emp.nationality,
          hourly_rate: emp.hourly_rate,
          current_location: emp.current_location,
        };
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
      // Continue without employee data
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: role,
        employee: employeeData,
      },
    });
  } catch (error) {
    console.error('Error fetching current user role:', error);
    return NextResponse.json({ error: 'Failed to fetch user role' }, { status: 500 });
  }
}
