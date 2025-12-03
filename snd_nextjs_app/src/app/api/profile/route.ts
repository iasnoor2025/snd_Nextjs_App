
import { db } from '@/lib/db';
import { departments, designations, employees, users } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { cacheQueryResult, generateCacheKey, CACHE_TAGS } from '@/lib/redis';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

// GET /api/profile - Get current user profile
const getProfileHandler = async (_request: NextRequest) => {
  // Get the current user session (for user ID in handler)
  const session = await getServerSession();

  if (!session?.user?.id) {
    // This should not happen as withPermission handles auth, but keep for safety
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    // Debug: Check what employees exist in the database
        const allEmployees = await db
          .select({
            id: employees.id,
            firstName: employees.firstName,
            lastName: employees.lastName,
            email: employees.email,
            userId: employees.userId,
            iqamaNumber: employees.iqamaNumber,
          })
          .from(employees)
          .limit(10);

                // Debug: Check if there's an employee linked to this user
        const userLinkedEmployees = await db
          .select({
            id: employees.id,
            firstName: employees.firstName,
            lastName: employees.lastName,
            email: employees.email,
            userId: employees.userId,
            iqamaNumber: employees.iqamaNumber,
          })
          .from(employees)
          .where(eq(employees.userId, parseInt(userId)));
        // Generate cache key for user profile
        const cacheKey = generateCacheKey('profile', 'user', { userId });
    
    return await cacheQueryResult(
      cacheKey,
      async () => {
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
        // Debug: Check what employees exist in the database
        const allEmployees = await db
          .select({
            id: employees.id,
            firstName: employees.firstName,
            lastName: employees.lastName,
            email: employees.email,
            userId: employees.userId,
            iqamaNumber: employees.iqamaNumber,
          })
          .from(employees)
          .limit(10);

                // Get employee data if exists (direct user_id match)
        let employee = null;
        
        // First try to find employee by National ID match (this should be the primary method)
        if (user.nationalId) {
          const nationalIdEmployeeRows = await db
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

          if (nationalIdEmployeeRows.length > 0) {
            employee = nationalIdEmployeeRows[0];
            // Auto-link this employee to the user if not already linked
            if (!employee.userId) {
              try {
                await db
                  .update(employees)
                  .set({ 
                    userId: parseInt(user.id.toString()),
                    email: user.email
                  })
                  .where(eq(employees.id, employee.id));
                
                employee.userId = parseInt(user.id.toString());
                employee.email = user.email;
              } catch (linkError) {
                console.error('Failed to auto-link employee:', linkError);
              }
            }
          }
        }
        
        // If no employee found by National ID, try direct userId match as fallback
        if (!employee) {
          const directEmployeeRows = await db
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
            .where(eq(employees.userId, parseInt(user.id.toString())))
            .limit(1);

          employee = directEmployeeRows.length > 0 ? directEmployeeRows[0] : null;
        }

        // Debug logging
        // Use the employee found (either by National ID or direct userId)
        const bestEmployee = employee;
        
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
          // Additional info for debugging and user guidance
          needsNationalId: !user.nationalId && !bestEmployee,
          employeeLinked: !!bestEmployee,
          employeeSource: bestEmployee ? (bestEmployee.userId === parseInt(user.id.toString()) ? 'direct' : 'nationalId') : 'none',
          employeeId: bestEmployee?.id || null
        };

        return NextResponse.json(profile);
      },
      {
        tags: [CACHE_TAGS.PROFILE, CACHE_TAGS.USER],
        ttl: 300, // Cache for 5 minutes
      }
    );
  } catch (error) {
    console.error('Profile fetch error:', error);
    
    // Return a proper error response instead of session data
    return NextResponse.json(
      {
        error: 'Failed to fetch profile data: ' + (error instanceof Error ? error.message : 'Unknown error'),
        // Fallback to basic session data for display purposes
        id: session?.user?.id || '',
        name: session?.user?.name || '',
        email: session?.user?.email || '',
        phone: '',
        firstName: '',
        lastName: '',
        role: session?.user?.role || 'USER',
        status: session?.user?.isActive ? 'active' : 'inactive',
      },
      { status: 500 }
    );
  }
}

// PUT /api/profile - Update user profile
export async function POST(_request: NextRequest) {
  try {
    // Get the current user session (for user ID in handler)
    const session = await getServerSession();

    if (!session?.user?.id) {
      // This should not happen as withPermission handles auth, but keep for safety
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;

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
      // Create new employee record if we have the required data
      if (firstName || lastName || phone || address || city || state || country) {
        try {
          const newEmployeeRows = await db
            .insert(employees)
            .values({
              userId: parseInt(userId),
              firstName: firstName || '',
              middleName: middleName || '',
              lastName: lastName || '',
              phone: phone || '',
              address: address || '',
              city: city || '',
              state: state || '',
              country: country || '',
              email: email || '',
            })
            .returning();

          if (newEmployeeRows.length > 0) {
            employee = newEmployeeRows[0]!;
          }
        } catch (createError) {
          console.error('Failed to create employee record:', createError);
          // Continue without employee record
        }
      }
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
