import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

import { db } from '@/lib/drizzle';
import { users, roles, permissions, roleHasPermissions, modelHasRoles } from '@/lib/drizzle/schema';
import { eq, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get the current user's session
    const session = await getServerSession();
    
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

    // Get all roles for this user from modelHasRoles
    const userRoles = await db
      .select({
        roleId: modelHasRoles.roleId,
        roleName: roles.name,
      })
      .from(modelHasRoles)
      .leftJoin(roles, eq(modelHasRoles.roleId, roles.id))
      .where(eq(modelHasRoles.userId, userId));

    const roleIds = userRoles.map(ur => ur.roleId).filter((id): id is number => id !== null);
    const roleNames = userRoles.map(ur => ur.roleName).filter((name): name is string => name !== null);
    
    const roleName = roleNames[0] || 'UNKNOWN';
    // Role name retrieved

    if (roleIds.length === 0) {
      return NextResponse.json({
        success: true,
        userId: user.id,
        role: roleName,
        permissions: [],
        permissionsCount: 0,
      });
    }

    // Get all permissions for all user's roles
    const userPermissions = await db
      .select({
        permissionName: permissions.name,
      })
      .from(roleHasPermissions)
      .leftJoin(permissions, eq(roleHasPermissions.permissionId, permissions.id))
      .where(inArray(roleHasPermissions.roleId, roleIds));

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
