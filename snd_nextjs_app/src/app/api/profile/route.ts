import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';

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

    // Test database connection first
    try {
      await prisma.$connect();
      console.log('✅ Profile API: Database connected successfully');
    } catch (dbError) {
      console.error('❌ Profile API: Database connection failed:', dbError);
      // Return session user data if database is not available
      const sessionProfile = {
        id: session.user.id,
        name: session.user.name || "Authenticated User",
        email: session.user.email || "",
        phone: "",
        avatar: "",
        role: session.user.role || "USER",
        department: "General",
        location: "",
        bio: "This is your profile from session data. Set up your database to see full profile information.",
        joinDate: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        status: session.user.isActive ? "active" : "inactive",
        firstName: "",
        middleName: "",
        lastName: "",
        designation: "",
        address: "",
        city: "",
        state: "",
        country: "",
      };

      console.log('✅ Profile API: Returning session profile due to database error');
      return NextResponse.json(sessionProfile);
    }

    // Get user from database
    console.log('🔍 Profile API: Fetching user from database...');
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        name: true,
        email: true,
        role_id: true,
        avatar: true,
        locale: true,
        last_login_at: true,
        isActive: true,
        created_at: true,
        updated_at: true,
        national_id: true,
      },
    });

    if (!user) {
      console.log('❌ Profile API: User not found in database');
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    console.log('✅ Profile API: Found user:', user);

    // Get employee data if exists (direct user_id match)
    const employee = await prisma.employee.findFirst({
      where: { user_id: parseInt(user.id.toString()) },  
      select: {
        id: true,
        first_name: true,
        middle_name: true,
        last_name: true,
        employee_id: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        state: true,
        country: true,
        nationality: true,
        date_of_birth: true,
        hire_date: true,
        iqama_number: true,
        iqama_expiry: true,
        passport_number: true,
        passport_expiry: true,
        driving_license_number: true,
        driving_license_expiry: true,
        operator_license_number: true,
        operator_license_expiry: true,
        designation: {
          select: {
            name: true,
          },
        },
        department: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log('Found employee data:', employee);

    // Check if user's national ID matches any employee's Iqama number
    let matchedEmployee = null;
    if (user.national_id) {
      console.log('Checking for Nation ID match:', user.national_id);
      matchedEmployee = await prisma.employee.findFirst({
        where: { iqama_number: user.national_id },
        select: {
          id: true,
          first_name: true,
          middle_name: true,
          last_name: true,
          employee_id: true,
          phone: true,
          email: true,
          address: true,
          city: true,
          state: true,
          country: true,
          nationality: true,
          date_of_birth: true,
          hire_date: true,
          iqama_number: true,
          iqama_expiry: true,
          passport_number: true,
          passport_expiry: true,
          driving_license_number: true,
          driving_license_expiry: true,
          operator_license_number: true,
          operator_license_expiry: true,
          designation: {
            select: { name: true }
          },
          department: {
            select: { name: true }
          }
        }
      });
      console.log('Matched employee found:', matchedEmployee);

      // Auto-update employee email if it doesn't match user's email
      if (matchedEmployee && matchedEmployee.email !== user.email) {
        console.log('Auto-updating employee email from', matchedEmployee.email, 'to', user.email);
        try {
          await prisma.employee.update({
            where: { id: matchedEmployee.id },
            data: { email: user.email }
          });
          console.log('✅ Successfully updated employee email');
          // Update the matchedEmployee object with new email
          matchedEmployee.email = user.email;
        } catch (updateError) {
          console.error('❌ Error updating employee email:', updateError);
        }
      }
    }

    // If no direct employee record, try to find by email match
    let emailMatchedEmployee = null;
    if (!employee && user.email) {
      console.log('Checking for email match:', user.email);
      emailMatchedEmployee = await prisma.employee.findFirst({
        where: { email: user.email },
        select: {
          id: true,
          first_name: true,
          middle_name: true,
          last_name: true,
          employee_id: true,
          phone: true,
          email: true,
          address: true,
          city: true,
          state: true,
          country: true,
          nationality: true,
          date_of_birth: true,
          hire_date: true,
          iqama_number: true,
          iqama_expiry: true,
          passport_number: true,
          passport_expiry: true,
          driving_license_number: true,
          driving_license_expiry: true,
          operator_license_number: true,
          operator_license_expiry: true,
          designation: {
            select: { name: true }
          },
          department: {
            select: { name: true }
          }
        }
      });
      console.log('Email matched employee found:', emailMatchedEmployee);
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
      role: user.role_id,
      department: bestEmployee?.department?.name || 'General',
      location: bestEmployee?.city && bestEmployee?.state
        ? `${bestEmployee.city}, ${bestEmployee.state}`
        : bestEmployee?.country || '',
      bio: '', // Could be added to user model later
      joinDate: user.created_at.toISOString(),
      lastLogin: user.last_login_at?.toISOString() || user.created_at.toISOString(),
      status: user.isActive ? 'active' : 'inactive',
      nationalId: user.national_id || '',
      // Employee specific fields (from best available employee data)
      firstName: bestEmployee?.first_name || '',
      middleName: bestEmployee?.middle_name || '',
      lastName: bestEmployee?.last_name || '',
      designation: bestEmployee?.designation?.name || '',
      address: bestEmployee?.address || '',
      city: bestEmployee?.city || '',
      state: bestEmployee?.state || '',
      country: bestEmployee?.country || '',
      // Matched employee details (only if Nation ID matches Iqama)
      matchedEmployee: matchedEmployee,
    };

    console.log('Final profile response:', profile);
    console.log('User national_id from database:', user.national_id);
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
  } finally {
    try {
      await prisma.$disconnect();
      console.log('✅ Profile API: Database disconnected');
    } catch (disconnectError) {
      console.error('❌ Profile API: Error disconnecting from database:', disconnectError);
    }
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
