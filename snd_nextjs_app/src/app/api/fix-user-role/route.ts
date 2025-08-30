import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { users, roles } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 API: Fixing user role...');
    
    // Get the current user's session
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No valid session found' },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;
    console.log('🔍 API: Fixing role for user:', userEmail);

    // Get user from database
    const userRecord = await db
      .select({
        id: users.id,
        email: users.email,
        roleId: users.roleId,
      })
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    const user = userRecord[0];
    console.log('🔍 API: User found with roleId:', user.roleId);

    // Get the actual role name from the roles table
    const roleRecord = await db
      .select({
        id: roles.id,
        name: roles.name,
      })
      .from(roles)
      .where(eq(roles.id, user.roleId))
      .limit(1);

    if (roleRecord.length === 0) {
      return NextResponse.json(
        { error: 'Role not found in database' },
        { status: 404 }
      );
    }

    const actualRole = roleRecord[0];
    console.log('🔍 API: Actual role in database:', actualRole);

    // Check if the role is HR_SPECIALIST
    if (actualRole.name === 'HR_SPECIALIST') {
      console.log('✅ API: User has correct HR_SPECIALIST role');
      
      return NextResponse.json({
        success: true,
        message: 'User role is correct',
        userId: user.id,
        email: user.email,
        roleId: user.roleId,
        actualRole: actualRole.name,
        sessionRole: session.user.role,
        needsFix: session.user.role !== actualRole.name
      });
    } else {
      console.log('⚠️ API: User role mismatch');
      
      return NextResponse.json({
        success: false,
        message: 'User role mismatch detected',
        userId: user.id,
        email: user.email,
        roleId: user.roleId,
        actualRole: actualRole.name,
        sessionRole: session.user.role,
        needsFix: true
      });
    }

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check user role',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
