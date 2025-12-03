import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

import { db } from '@/lib/drizzle';
import { users } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { checkUserPermission } from '@/lib/rbac/permission-service';

export async function POST(request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Check if user has permission to update their own profile (password change is part of profile update)
    const permissionCheck = await checkUserPermission(userId, 'update', 'own-profile');
    
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: 'Access denied. Permission required to change password.' },
        { status: 403 }
      );
    }
    // Get user with current password hash
    const userRows = await db
      .select({
        id: users.id,
        password: users.password,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userRows[0]!;

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update user's password
    await db
      .update(users)
      .set({
        password: hashedNewPassword,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, parseInt(userId)));

    return NextResponse.json({
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      {
        error: 'Failed to change password: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}
