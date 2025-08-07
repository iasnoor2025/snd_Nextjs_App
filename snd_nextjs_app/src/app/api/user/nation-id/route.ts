import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';

// GET /api/user/nation-id - Check if user has nation ID
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
          matchedEmployee: null
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
          matchedEmployee: null
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
    
    // Optimized query to get user and employee data in one go
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        national_id: true,
        name: true,
        email: true,
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
          matchedEmployee: null
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

    // Only check for matched employee if user has a national ID
    let matchedEmployee = null;
    if (user.national_id) {
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
      'ETag': `"nation-id-${userId}-${user.national_id || 'none'}"`,
    };

    return NextResponse.json(result, { headers: cacheHeaders });
    
  } catch (error) {
    console.error('❌ Error checking nation ID:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check nation ID',
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

// PUT /api/user/nation-id - Update user's nation ID
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { nationId } = body;

    if (!nationId || typeof nationId !== 'string' || nationId.trim() === '') {
      return NextResponse.json(
        { error: 'Nation ID is required' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);
    
    // Check if nation ID is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        national_id: nationId.trim(),
        id: { not: userId },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Nation ID is already registered by another user' },
        { status: 400 }
      );
    }

    // Update user's nation ID
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        national_id: nationId.trim(),
      },
      select: {
        id: true,
        national_id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Nation ID updated successfully',
      nationId: updatedUser.national_id,
      userId: updatedUser.id,
    });
  } catch (error) {
    console.error('Error updating nation ID:', error);
    return NextResponse.json(
      { error: 'Failed to update nation ID' },
      { status: 500 }
    );
  }
} 