import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';

// GET /api/user/nation-id - Check if user has nation ID
export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    const userId = parseInt(session.user.id);
    
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
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if nation ID matches any employee's Iqama number
    let matchedEmployee = null;
    if (user.national_id) {
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
    }

    return NextResponse.json({
      hasNationId: !!user.national_id,
      nationId: user.national_id,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      matchedEmployee: matchedEmployee,
    });
  } catch (error) {
    console.error('Error checking nation ID:', error);
    return NextResponse.json(
      { error: 'Failed to check nation ID' },
      { status: 500 }
    );
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