import { NextRequest, NextResponse } from 'next/server';
import { db, prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { users, employees, designations, departments } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

// GET /api/profile - Get current user profile
export async function GET(request: NextRequest) {
  // Get the current user session
  const session = await getServerSession(authConfig);
  
  console.log('🔍 Profile API: Session data:', session);
  console.log('🔍 Profile API: Session user:', session?.user);

  if (!session?.user?.id) {
    console.log('❌ Profile API: No session or user ID found');
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    console.log('🔍 Profile API: Starting request...');
    
    const userId = session.user.id;
    console.log('✅ Profile API: Current user ID from session:', userId);

    // Get user from database
    console.log('🔍 Profile API: Fetching user from database...');
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
      console.log('❌ Profile API: User not found in database');
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    const user = userRows[0];

    if (!user) {
      console.log('❌ Profile API: User not found in database');
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    console.log('✅ Profile API: Found user:', user);

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

    console.log('Found employee data:', employee);

    // Check if user's national ID matches any employee's Iqama number
    let matchedEmployee: any = null;
    if (user.nationalId) {
      console.log('🔍 Profile API: Checking for National ID match with employee Iqama number:', user.nationalId);
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
        })
        .from(employees)
        .where(eq(employees.iqamaNumber, user.nationalId))
        .limit(1);

      if (matchedEmployeeRows.length > 0) {
        matchedEmployee = matchedEmployeeRows[0];
        console.log('✅ Profile API: Found employee with matching Iqama number:', matchedEmployee);
        
        // Step 3: Auto-update employee email if it doesn't match user's email
        if (matchedEmployee.email !== user.email) {
          console.log('🔄 Profile API: Auto-updating employee email from', matchedEmployee.email, 'to', user.email);
          try {
            await db
              .update(employees)
              .set({ email: user.email })
              .where(eq(employees.id, matchedEmployee.id));
            console.log('✅ Profile API: Successfully updated employee email');
            // Update the matchedEmployee object with new email
            matchedEmployee.email = user.email;
          } catch (updateError) {
            console.error('❌ Profile API: Error updating employee email:', updateError);
          }
        }
        
        // Step 4: Establish relationship by updating employee's userId field
        if (!matchedEmployee.userId || matchedEmployee.userId !== parseInt(user.id.toString())) {
          console.log('🔗 Profile API: Establishing user-employee relationship by updating userId field');
          try {
            await db
              .update(employees)
              .set({ userId: parseInt(user.id.toString()) })
              .where(eq(employees.id, matchedEmployee.id));
            console.log('✅ Profile API: Successfully linked user to employee via userId');
            // Update the matchedEmployee object with new userId
            matchedEmployee.userId = parseInt(user.id.toString());
          } catch (linkError) {
            console.error('❌ Profile API: Error linking user to employee:', linkError);
          }
        } else {
          console.log('✅ Profile API: User-employee relationship already established');
        }
      } else {
        console.log('❌ Profile API: No employee found with matching Iqama number:', user.nationalId);
      }
    } else {
      console.log('⚠️ Profile API: User has no national_id, cannot match with employee Iqama number');
    }

    // If no direct employee record, try to find by email match
    let emailMatchedEmployee: any = null;
    if (!employee && user.email) {
      console.log('🔍 Profile API: Checking for email match:', user.email);
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
        console.log('✅ Profile API: Found employee with matching email:', emailMatchedEmployee);
        
        // Establish relationship by updating employee's userId field if not already set
        if (!emailMatchedEmployee.userId || emailMatchedEmployee.userId !== parseInt(user.id.toString())) {
          console.log('🔗 Profile API: Establishing user-employee relationship via email match');
          try {
            await db
              .update(employees)
              .set({ userId: parseInt(user.id.toString()) })
              .where(eq(employees.id, emailMatchedEmployee.id));
            console.log('✅ Profile API: Successfully linked user to employee via email match');
            // Update the emailMatchedEmployee object with new userId
            emailMatchedEmployee.userId = parseInt(user.id.toString());
          } catch (linkError) {
            console.error('❌ Profile API: Error linking user to employee via email:', linkError);
          }
        } else {
          console.log('✅ Profile API: User-employee relationship already established via email');
        }
      } else {
        console.log('❌ Profile API: No employee found with matching email:', user.email);
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
      location: bestEmployee?.city && bestEmployee?.state
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

    console.log('Final profile response:', profile);
    console.log('User nationalId from database:', user.nationalId);
    console.log('Profile nationalId field:', profile.nationalId);
    return NextResponse.json(profile);
  } catch (error) {
    console.error('❌ Profile API: Error fetching profile:', error);
    console.error('❌ Profile API: Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Return session user data on any error
    const sessionProfile = {
      id: session?.user?.id || "error-user",  
      name: session?.user?.name || "Authenticated User",
      email: session?.user?.email || "",
      phone: "",
      avatar: "",
      role: session?.user?.role || "USER",
      department: "General",
      location: "",
      bio: "This is your profile from session data. Database error occurred: " + (error instanceof Error ? error.message : 'Unknown error'),
      joinDate: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      status: session?.user?.isActive ? "active" : "inactive",
      nationalId: "",
      firstName: "",
      middleName: "",
      lastName: "",
      designation: "",
      address: "",
      city: "",
      state: "",
      country: "",
    };

    console.log('✅ Profile API: Returning session profile due to error');
    return NextResponse.json(sessionProfile);
  }
}

// PUT /api/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
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
      designation,
      department,
      nationalId
    } = body;

    const userId = session.user.id;
    console.log('Updating profile for user ID:', userId);

    // Test database connection first
    try {
      await prisma.$connect();
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database not available. Please set up your database first.' },
        { status: 503 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        name,
        email,
        national_id: nationalId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        national_id: true,
        role_id: true,
        avatar: true,
        last_login_at: true,
        isActive: true,
        created_at: true,
        updated_at: true,
      },
    });

    // Update or create employee record
    let employee = await prisma.employee.findFirst({
      where: { user_id: parseInt(userId) },
      include: {
        designation: {
          select: { name: true },
        },
        department: {
          select: { name: true },
        },
      },
    });

    console.log('Found existing employee:', employee);

    if (employee) {
      // Update existing employee
      console.log('Updating existing employee...');
      employee = await prisma.employee.update({
        where: { id: employee.id },
        data: {
          first_name: firstName || employee.first_name,
          middle_name: middleName || employee.middle_name,
          last_name: lastName || employee.last_name,
          phone: phone || employee.phone,
          address: address || employee.address,
          city: city || employee.city,
          state: state || employee.state,
          country: country || employee.country,
        },
        include: {
          designation: {
            select: { name: true },
          },
          department: {
            select: { name: true },
          },
        },
      });
      console.log('Updated employee:', employee);
    } else {
      // No employee record exists - don't create one
      console.log('No employee record found - not creating one');
    }

    // Format the response
    const profile = {
      id: updatedUser.id,
      name: updatedUser.name || 'Unknown User',
      email: updatedUser.email,
      phone: employee?.phone || '',
      avatar: updatedUser.avatar || '',
      role: updatedUser.role_id,
      department: employee?.department?.name || 'General', 
      location: employee?.city && employee?.state
        ? `${employee.city}, ${employee.state}`
        : employee?.country || '',
      bio: '',
      joinDate: updatedUser.created_at.toISOString(),
      lastLogin: updatedUser.last_login_at?.toISOString() || updatedUser.created_at.toISOString(),
      status: updatedUser.isActive ? 'active' : 'inactive',
      nationalId: updatedUser.national_id || '',
      firstName: employee?.first_name || '',
      middleName: employee?.middle_name || '',
      lastName: employee?.last_name || '',
      designation: employee?.designation?.name || '', 
      address: employee?.address || '',
      city: employee?.city || '',
      state: employee?.state || '',
      country: employee?.country || '',
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
