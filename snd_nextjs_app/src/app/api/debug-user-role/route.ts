import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, roles } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get user from database by email
    const userRecord = await db
      .select({
        id: users.id,
        email: users.email,
        roleId: users.roleId,
        name: users.name,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.email, 'test@test.com'))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json(
        { error: 'User test@test.com not found in database' },
        { status: 404 }
      );
    }

    const user = userRecord[0];

    // Get the role name from the roles table
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

    const role = roleRecord[0];

    // Get all available roles for reference
    const allRoles = await db
      .select({
        id: roles.id,
        name: roles.name,
      })
      .from(roles)
      .orderBy(roles.id);

    // All roles retrieved

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        roleId: user.roleId,
        name: user.name,
        isActive: user.isActive,
      },
      role: {
        id: role.id,
        name: role.name,
      },
      allRoles: allRoles,
      issue: user.roleId === 1 ? 'User has role_id=1 (SUPER_ADMIN) but should be HR_SPECIALIST' : 'Role ID mismatch'
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to debug user role',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
