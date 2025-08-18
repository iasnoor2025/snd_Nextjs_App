import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { modelHasRoles, roles, users } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's role information
    const userRoleInfo = await db
      .select({
        userId: users.id,
        userName: users.name,
        userEmail: users.email,

        roleId: roles.id,
        roleName: roles.name,
      })
      .from(users)
      .leftJoin(modelHasRoles, eq(users.id, modelHasRoles.userId))
      .leftJoin(roles, eq(modelHasRoles.roleId, roles.id))
      .where(eq(users.id, parseInt(session.user.id)))
      .limit(1);

    const userRole = userRoleInfo[0];

    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
      databaseInfo: userRole
        ? {
            userId: userRole.userId,
            userName: userRole.userName,
            userEmail: userRole.userEmail,

            roleId: userRole.roleId,
            roleName: userRole.roleName,
          }
        : null,
      sessionData: {
        user: session.user,
        expires: session.expires,
      },
    });
  } catch (error) {
    console.error('Error testing permissions:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
