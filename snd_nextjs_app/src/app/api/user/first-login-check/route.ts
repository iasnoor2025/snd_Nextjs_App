import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';

// GET /api/user/first-login-check - Check if this is first login and establish employee relationship
export async function GET(request: NextRequest) {
  let dbConnected = false;
  
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

    // Test database connection with timeout
    try {
      await Promise.race([
        prisma.$connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database connection timeout')), 3000)
        )
      ]);
      dbConnected = true;
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          hasNationId: false,
          nationId: null,
          userId: null,
          userName: null,
          userEmail: null,
          matchedEmployee: null,
          isFirstLogin: false
        },
        { 
          status: 503,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }
    
    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        national_id: true,
        name: true,
        email: true,
        created_at: true,
        updated_at: true,
      },
    });

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
      let matchedEmployee = null;
      try {
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
    let matchedEmployee = null;
    let isFirstLogin = true;

    if (user.email) {
      try {
        // First try to find employee by email match
        matchedEmployee = await prisma.employee.findFirst({
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

        // If found by email, update employee email to match user email and set national_id
        if (matchedEmployee) {
          try {
            // Update employee email if different
            if ((matchedEmployee as any).email !== (user as any).email) {
              await prisma.employee.update({
                where: { id: (matchedEmployee as any).id },
                data: { email: user.email }
              });
              console.log('✅ Updated employee email to match user email');
            }

            // Update user's national_id to match employee's iqama_number
            await prisma.user.update({
              where: { id: userId },
              data: { national_id: (matchedEmployee as any).iqama_number }
            });
            console.log('✅ Updated user national_id to match employee iqama');

            // Update the matchedEmployee object with new email
            (matchedEmployee as any).email = (user as any).email;
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
  } finally {
    if (dbConnected) {
      try {
        await prisma.$disconnect();
      } catch (disconnectError) {
        console.error('Error disconnecting from database:', disconnectError);
      }
    }
  }
}
