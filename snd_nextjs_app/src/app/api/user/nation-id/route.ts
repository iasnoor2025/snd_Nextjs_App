import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { departments, designations, employees, users } from '@/lib/drizzle/schema';
import { and, eq, ne } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/user/nation-id - Check if user has nation ID
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
        },
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      );
    }

    const userId = parseInt(session.user.id);

    // Optimized query to get user data using Drizzle
    const userRows = await db
      .select({
        id: users.id,
        national_id: users.nationalId,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userRows.length === 0) {
      return NextResponse.json(
        {
          error: 'User not found',
          hasNationId: false,
          nationId: null,
          userId: null,
          userName: null,
          userEmail: null,
          matchedEmployee: null,
        },
        {
          status: 404,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      );
    }

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
        },
        {
          status: 404,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      );
    }

    // Only check for matched employee if user has a national ID
    let matchedEmployee: any = null;
    if (user.national_id) {
      try {
        const matchedEmployeeRows = await db
          .select({
            id: employees.id,
            first_name: employees.firstName,
            middle_name: employees.middleName,
            last_name: employees.lastName,
            file_number: employees.fileNumber,
            phone: employees.phone,
            email: employees.email,
            address: employees.address,
            city: employees.city,
            state: employees.state,
            country: employees.country,
            nationality: employees.nationality,
            date_of_birth: employees.dateOfBirth,
            hire_date: employees.hireDate,
            iqama_number: employees.iqamaNumber,
            iqama_expiry: employees.iqamaExpiry,
            passport_number: employees.passportNumber,
            passport_expiry: employees.passportExpiry,
            driving_license_number: employees.drivingLicenseNumber,
            driving_license_expiry: employees.drivingLicenseExpiry,
            operator_license_number: employees.operatorLicenseNumber,
            operator_license_expiry: employees.operatorLicenseExpiry,
            designation: {
              name: designations.name,
            },
            department: {
              name: departments.name,
            },
          })
          .from(employees)
          .leftJoin(designations, eq(employees.designationId, designations.id))
          .leftJoin(departments, eq(employees.departmentId, departments.id))
          .where(eq(employees.iqamaNumber, user.national_id))
          .limit(1);

        if (matchedEmployeeRows.length > 0) {
          matchedEmployee = matchedEmployeeRows[0];
        }
      } catch (employeeError) {
        
        // Continue without matched employee data
      }
    }

    const result = {
      hasNationId: !!user.national_id,
      nationId: user.national_id,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      matchedEmployee: matchedEmployee,
    };

    // Add cache headers for successful responses
    const cacheHeaders = {
      'Cache-Control': 'public, max-age=300, s-maxage=300', // 5 minutes cache
      ETag: `"nation-id-${userId}-${user.national_id || 'none'}"`,
    };

    return NextResponse.json(result, { headers: cacheHeaders });
  } catch (error) {
    
    return NextResponse.json(
      {
        error: 'Failed to check nation ID',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  }
}

// PUT /api/user/nation-id - Update user's nation ID
export async function PUT(_request: NextRequest) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await _request.json();
    const { nationId } = body;

    if (!nationId || typeof nationId !== 'string' || nationId.trim() === '') {
      return NextResponse.json({ error: 'Nation ID is required' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);

    // Check if nation ID is already taken by another user using Drizzle
    const existingUserRows = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.nationalId, nationId.trim()), ne(users.id, userId)))
      .limit(1);

    if (existingUserRows.length > 0) {
      return NextResponse.json(
        { error: 'Nation ID is already registered by another user' },
        { status: 400 }
      );
    }

    // Update user's nation ID using Drizzle
    const updatedUserRows = await db
      .update(users)
      .set({
        nationalId: nationId.trim(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        national_id: users.nationalId,
        name: users.name,
        email: users.email,
      });

    const updatedUser = updatedUserRows[0];

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    // Now automatically link employee record if found by National ID
    let linkedEmployee = null;
    try {
      // Find employee by National ID (Iqama number)
      const employeeRows = await db
        .select({
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          email: employees.email,
          userId: employees.userId,
        })
        .from(employees)
        .where(eq(employees.iqamaNumber, nationId.trim()))
        .limit(1);

      if (employeeRows.length > 0) {
        const employee = employeeRows[0];
        
        // Link employee to user and update email
        await db
          .update(employees)
          .set({
            userId: userId,
            email: updatedUser.email, // Update employee email to match user email
          })
          .where(eq(employees.id, employee.id));

        linkedEmployee = {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: updatedUser.email,
          userId: userId,
        };

        console.log('Successfully linked employee to user:', {
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          userId: userId,
          userEmail: updatedUser.email
        });
      } else {
        console.log('No employee found with National ID:', nationId.trim());
      }
    } catch (linkError) {
      console.error('Failed to link employee:', linkError);
      // Continue without employee linking - user can still access the system
    }

    return NextResponse.json({
      success: true,
      message: 'Nation ID updated successfully',
      nationId: updatedUser.national_id,
      userId: updatedUser.id,
      employeeLinked: !!linkedEmployee,
      employee: linkedEmployee,
    });
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to update nation ID' }, { status: 500 });
  }
}
