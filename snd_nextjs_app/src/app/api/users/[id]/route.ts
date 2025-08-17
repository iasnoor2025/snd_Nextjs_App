import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

// GET /api/users/[id] - Get user by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userRows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role_id: users.roleId,
        isActive: users.isActive,
        created_at: users.createdAt,
        last_login_at: users.lastLoginAt,
      })
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (userRows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userRows[0];
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUserRows = await db
      .select({ id: users.id, roleId: users.roleId, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (existingUserRows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const existingUser = existingUserRows[0];

    // Update user
    const updatedUserRows = await db
      .update(users)
      .set({
        name: body.name,
        email: body.email,
        roleId: body.role_id || existingUser.roleId,
        isActive: body.isActive !== undefined ? body.isActive : existingUser.isActive,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, parseInt(id)))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role_id: users.roleId,
        isActive: users.isActive,
        created_at: users.createdAt,
        last_login_at: users.lastLoginAt,
      });

    const updatedUser = updatedUserRows[0];
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
