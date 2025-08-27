import { db } from '@/lib/db';
import { users as usersTable, roles as rolesTable, modelHasRoles as modelHasRolesTable } from '@/lib/drizzle/schema';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth-config';
import { eq } from 'drizzle-orm';

// GET /api/auth/me - Get current user's role
export async function GET() {
  try {
    // Get the current session
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Find the current user
    const currentUser = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
        role_id: usersTable.roleId,
      })
      .from(usersTable)
      .where(eq(usersTable.email, session.user.email))
      .limit(1);

    if (!currentUser[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = currentUser[0];

    // Determine role based on user_roles or fallback to role_id
    let role = 'USER';

    // Check if user has entries in modelHasRoles
    const userRoles = await db
      .select({
        role_id: rolesTable.id,
        role_name: rolesTable.name,
      })
      .from(modelHasRolesTable)
      .leftJoin(rolesTable, eq(rolesTable.id, modelHasRolesTable.roleId))
      .where(eq(modelHasRolesTable.userId, user.id));

    if (userRoles.length > 0 && userRoles[0]?.role_name) {
      // Use the first role found
      role = userRoles[0].role_name.toUpperCase();
    } else {
      // Fallback: If no user_roles found, try to get role from the roles table using role_id
      if (user.role_id) {
        const roleRecord = await db
          .select({ name: rolesTable.name })
          .from(rolesTable)
          .where(eq(rolesTable.id, user.role_id))
          .limit(1);
        
        if (roleRecord[0]?.name) {
          role = roleRecord[0].name.toUpperCase();
        }
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: role,
      },
    });
  } catch (error) {
    console.error('Error fetching current user role:', error);
    return NextResponse.json({ error: 'Failed to fetch user role' }, { status: 500 });
  }
}
