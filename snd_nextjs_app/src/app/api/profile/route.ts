import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { departments, designations, employees, users } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/profile - Get current user profile
export async function GET(_request: NextRequest) {
  // Get the current user session
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {

    const userId = session.user.id;

    // Get user from database
    
    const userRows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        roleId: users.roleId,
        avatar: users.avatar,
        locale: users.locale,
        lastLoginAt: users.lastLoginAt,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        nationalId: users.nationalId,
      })
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    if (userRows.length === 0) {
      
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    const user = userRows[0];

    if (!user) {
      
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    // Get employee data if exists (direct user_id match)
    const employeeRows = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        middleName: employees.middleName,
        lastName: employees.lastName,
        fileNumber: employees.fileNumber,
        phone: employees.phone,
        email: employees.email,
        address: employees.address,
        city: employees.city,
        state: employees.state,
        country: employees.country,
        nationality: employees.nationality,
        dateOfBirth: employees.dateOfBirth,
        hireDate: employees.hireDate,
        iqamaNumber: employees.iqamaNumber,
        iqamaExpiry: employees.iqamaExpiry,
        passportNumber: employees.passportNumber,
        passportExpiry: employees.passportExpiry,
        drivingLicenseNumber: employees.drivingLicenseNumber,
        drivingLicenseExpiry: employees.drivingLicenseExpiry,
        operatorLicenseNumber: employees.operatorLicenseNumber,
        operatorLicenseExpiry: employees.operatorLicenseExpiry,
        designationId: employees.designationId,
        departmentId: employees.departmentId,
      })
      .from(employees)
      .where(eq(employees.userId, parseInt(user.id.toString())))
      .limit(1);

    const employee = employeeRows.length > 0 ? employeeRows[0] : null;

    // Check if user's national ID matches any employee's Iqama number
    let matchedEmployee: any = null;
    if (user.nationalId) {
      
      const matchedEmployeeRows = await db
        .select({
          id: employees.id,
          firstName: employees.firstName,
          middleName: employees.middleName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
          phone: employees.phone,
          email: employees.email,
          address: employees.address,
          city: employees.city,
          state: employees.state,
          country: employees.country,
          nationality: employees.nationality,
          dateOfBirth: employees.dateOfBirth,
          hireDate: employees.hireDate,
          iqamaNumber: employees.iqamaNumber,
          iqamaExpiry: employees.iqamaExpiry,
          passportNumber: employees.passportNumber,
          passportExpiry: employees.passportExpiry,
          drivingLicenseNumber: employees.drivingLicenseNumber,
          drivingLicenseExpiry: employees.drivingLicenseExpiry,
          operatorLicenseNumber: employees.operatorLicenseNumber,
          operatorLicenseExpiry: employees.operatorLicenseExpiry,
          designationId: employees.designationId,
          departmentId: employees.departmentId,
          userId: employees.userId,
          designation: designations.name,
          department: departments.name,
        })
        .from(employees)
        .leftJoin(designations, eq(employees.designationId, designations.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(eq(employees.iqamaNumber, user.nationalId))
        .limit(1);

      if (matchedEmployeeRows.length > 0) {
        matchedEmployee = matchedEmployeeRows[0];

        // Step 3: Auto-update employee email if it doesn't match user's email
        if (matchedEmployee.email !== user.email) {
          
          try {
            await db
              .update(employees)
              .set({ email: user.email })
              .where(eq(employees.id, matchedEmployee.id));
            
            // Update the matchedEmployee object with new email
            matchedEmployee.email = user.email;
          } catch (updateError) {
            
          }
        }

        // Step 4: Establish relationship by updating employee's userId field
        if (!matchedEmployee.userId || matchedEmployee.userId !== parseInt(user.id.toString())) {
          
          try {
            await db
              .update(employees)
              .set({ userId: parseInt(user.id.toString()) })
              .where(eq(employees.id, matchedEmployee.id));
            
            // Update the matchedEmployee object with new userId
            matchedEmployee.userId = parseInt(user.id.toString());
          } catch (linkError) {
            
          }
        } else {
          
        }
      } else {
        
      }
    } else {
      
    }

    // If no direct employee record, try to find by email match
    let emailMatchedEmployee: any = null;
    if (!employee && user.email) {
      
      const emailMatchedEmployeeRows = await db
        .select({
          id: employees.id,
          firstName: employees.firstName,
          middleName: employees.middleName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
          phone: employees.phone,
          email: employees.email,
          address: employees.address,
          city: employees.city,
          state: employees.state,
          country: employees.country,
          nationality: employees.nationality,
          dateOfBirth: employees.dateOfBirth,
          hireDate: employees.hireDate,
          iqamaNumber: employees.iqamaNumber,
          iqamaExpiry: employees.iqamaExpiry,
          passportNumber: employees.passportNumber,
          passportExpiry: employees.passportExpiry,
          drivingLicenseNumber: employees.drivingLicenseNumber,
          drivingLicenseExpiry: employees.drivingLicenseExpiry,
          operatorLicenseNumber: employees.operatorLicenseNumber,
          operatorLicenseExpiry: employees.operatorLicenseExpiry,
          designationId: employees.designationId,
          departmentId: employees.departmentId,
          userId: employees.userId,
        })
        .from(employees)
        .where(eq(employees.email, user.email))
        .limit(1);

      if (emailMatchedEmployeeRows.length > 0) {
        emailMatchedEmployee = emailMatchedEmployeeRows[0];

        // Establish relationship by updating employee's userId field if not already set
        if (
          !emailMatchedEmployee.userId ||
          emailMatchedEmployee.userId !== parseInt(user.id.toString())
        ) {
          
          try {
            await db
              .update(employees)
              .set({ userId: parseInt(user.id.toString()) })
              .where(eq(employees.id, emailMatchedEmployee.id));
            
            // Update the emailMatchedEmployee object with new userId
            emailMatchedEmployee.userId = parseInt(user.id.toString());
          } catch (linkError) {
            
          }
        } else {
          
        }
      } else {
        
      }
    }

    // Use the best available employee data
    const bestEmployee = employee || emailMatchedEmployee || matchedEmployee;

    // Format the response
    const profile = {
      id: user.id,
      name: user.name || 'Unknown User',
      email: user.email,
      phone: bestEmployee?.phone || '',
      avatar: user.avatar || '',
      role: user.roleId,
      department: bestEmployee?.department?.name || 'General',
      location:
        bestEmployee?.city && bestEmployee?.state
          ? `${bestEmployee.city}, ${bestEmployee.state}`
          : bestEmployee?.country || '',
      bio: '', // Could be added to user model later
      joinDate: user.createdAt,
      lastLogin: user.lastLoginAt || user.createdAt,
      status: user.isActive ? 'active' : 'inactive',
      nationalId: user.nationalId || '',
      // Employee specific fields (from best available employee data)
      firstName: bestEmployee?.firstName || '',
      middleName: bestEmployee?.middleName || '',
      lastName: bestEmployee?.lastName || '',
      designation: bestEmployee?.designation?.name || '',
      address: bestEmployee?.address || '',
      city: bestEmployee?.city || '',
      state: bestEmployee?.state || '',
      country: bestEmployee?.country || '',
      // Matched employee details (only if Nation ID matches Iqama)
      matchedEmployee: matchedEmployee,
    };

    return NextResponse.json(profile);
  } catch (error) {

    // Return session user data on any error
    const sessionProfile = {
      id: session?.user?.id || 'error-user',
      name: session?.user?.name || 'Authenticated User',
      email: session?.user?.email || '',
      phone: '',
      avatar: '',
      role: session?.user?.role || 'USER',
      department: 'General',
      location: '',
      bio:
        'This is your profile from session data. Database error occurred: ' +
        (error instanceof Error ? error.message : 'Unknown error'),
      joinDate: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      status: session?.user?.isActive ? 'active' : 'inactive',
      nationalId: '',
      firstName: '',
      middleName: '',
      lastName: '',
      designation: '',
      address: '',
      city: '',
      state: '',
      country: '',
    };

    return NextResponse.json(sessionProfile);
  }
}

// PUT /api/profile - Update user profile
export async function POST(_request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await _request.json();
    const {
      name,
      email,
      phone,
      firstName,
      middleName,
      lastName,
      address,
      city,
      state,
      country,
      // designation,
      // department,
      nationalId,
    } = body;

    const userId = session.user.id;

    // Check if user exists using Drizzle
    const existingUserRows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        nationalId: users.nationalId,
        roleId: users.roleId,
        avatar: users.avatar,
        lastLoginAt: users.lastLoginAt,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    if (existingUserRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const existingUser = existingUserRows[0]!;

    // Check if email is being changed and if it's already taken
    if (email && email !== existingUser.email) {
      const emailExistsRows = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (emailExistsRows.length > 0) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }
    }

    // Update user using Drizzle
    const updatedUserRows = await db
      .update(users)
      .set({
        name: name || existingUser.name,
        email: email || existingUser.email,
        nationalId: nationalId || existingUser.nationalId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, parseInt(userId)))
      .returning();

    const updatedUser = updatedUserRows[0]!;

    // Update or create employee record using Drizzle
    let employee = null;
    const existingEmployeeRows = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        middleName: employees.middleName,
        lastName: employees.lastName,
        phone: employees.phone,
        address: employees.address,
        city: employees.city,
        state: employees.state,
        country: employees.country,
        designationId: employees.designationId,
        departmentId: employees.departmentId,
      })
      .from(employees)
      .where(eq(employees.userId, parseInt(userId)))
      .limit(1);

    if (existingEmployeeRows.length > 0) {
      // Update existing employee
      
      const existingEmployee = existingEmployeeRows[0]!;
      const updatedEmployeeRows = await db
        .update(employees)
        .set({
          firstName: firstName || existingEmployee.firstName,
          middleName: middleName || existingEmployee.middleName,
          lastName: lastName || existingEmployee.lastName,
          phone: phone || existingEmployee.phone,
          address: address || existingEmployee.address,
          city: city || existingEmployee.city,
          state: state || existingEmployee.state,
          country: country || existingEmployee.country,
        })
        .where(eq(employees.id, existingEmployee.id))
        .returning();

      employee = updatedEmployeeRows[0]!;
      
    } else {
      // No employee record exists - don't create one
      
    }

    // Format the response
    const profile = {
      id: updatedUser.id,
      name: updatedUser.name || 'Unknown User',
      email: updatedUser.email,
      phone: employee?.phone || '',
      avatar: updatedUser.avatar || '',
      role: updatedUser.roleId,
      department: 'General', // Could be enhanced to get from designation/department
      location:
        employee?.city && employee?.state
          ? `${employee.city}, ${employee.state}`
          : employee?.country || '',
      bio: '',
      joinDate: updatedUser.createdAt,
      lastLogin: updatedUser.lastLoginAt || updatedUser.createdAt,
      status: updatedUser.isActive ? 'active' : 'inactive',
      nationalId: updatedUser.nationalId || '',
      firstName: employee?.firstName || '',
      middleName: employee?.middleName || '',
      lastName: employee?.lastName || '',
      designation: '', // Could be enhanced to get from designation
      address: employee?.address || '',
      city: employee?.city || '',
      state: employee?.state || '',
      country: employee?.country || '',
    };

    return NextResponse.json(profile);
  } catch (error) {
    
    return NextResponse.json(
      {
        error:
          'Failed to update profile: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}
