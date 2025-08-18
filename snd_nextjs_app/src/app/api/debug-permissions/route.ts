import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { permissions, roleHasPermissions, roles, users } from '@/lib/drizzle/schema';
import { getUserPermissions } from '@/lib/rbac/permission-service';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user info
    const userInfo = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        roleId: users.roleId,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    if (userInfo.length === 0) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    const user = userInfo[0];

    if (!user) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    // Get user's role
    const userRole = await db
      .select({
        id: roles.id,
        name: roles.name,
        guardName: roles.guardName,
      })
      .from(roles)
      .where(eq(roles.id, user.roleId))
      .limit(1);

    // Get all permissions
    const allPermissions = await db
      .select({
        id: permissions.id,
        name: permissions.name,
        guardName: permissions.guardName,
      })
      .from(permissions);

    // Get role permissions
    const rolePermissions = await db
      .select({
        permissionName: permissions.name,
      })
      .from(roleHasPermissions)
      .leftJoin(permissions, eq(permissions.id, roleHasPermissions.permissionId))
      .where(eq(roleHasPermissions.roleId, user.roleId));

    // Get user permissions via getUserPermissions function
    const userPermissions = await getUserPermissions(userId);

    return NextResponse.json({
      session: {
        userId: session.user.id,
        email: session.user.email,
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        isActive: user.isActive,
      },
      role: userRole[0] || null,
      allPermissions: allPermissions,
      rolePermissions: rolePermissions.map(rp => rp.permissionName).filter(Boolean),
      userPermissions: userPermissions,
      hasUserReadPermission: userPermissions?.permissions.includes('read.User') || false,
    });
  } catch (error) {
    console.error('Error in debug-permissions:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
