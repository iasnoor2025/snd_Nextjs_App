import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { users, roles, permissions, roleHasPermissions } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get the current user's session
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      console.log('❌ API: No valid session found');
      return NextResponse.json(
        { error: 'Unauthorized - No valid session' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    // Processing user ID

    // Get user's role ID from database
    const userRecord = await db
      .select({
        id: users.id,
        roleId: users.roleId,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userRecord.length === 0) {
      console.log('❌ API: User not found in database');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userRecord[0];
    // User found

    // Get role name
    const roleRecord = await db
      .select({
        name: roles.name,
      })
      .from(roles)
      .where(eq(roles.id, user.roleId))
      .limit(1);

    const roleName = roleRecord[0]?.name || 'UNKNOWN';
    // Role name retrieved

    // Get all permissions for the user's role
    const userPermissions = await db
      .select({
        permissionName: permissions.name,
      })
      .from(roleHasPermissions)
      .leftJoin(permissions, eq(roleHasPermissions.permissionId, permissions.id))
      .where(eq(roleHasPermissions.roleId, user.roleId));

    const permissionNames = userPermissions
      .map(p => p.permissionName)
      .filter((name): name is string => name !== null);
    
    // Permissions retrieved

    return NextResponse.json({
      success: true,
      userId: user.id,
      role: roleName,
      permissions: permissionNames,
      permissionsCount: permissionNames.length,
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user permissions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
