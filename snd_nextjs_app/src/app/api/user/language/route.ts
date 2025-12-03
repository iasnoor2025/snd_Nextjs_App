
import { getServerSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

const getLanguageHandler = async () => {
  try {
    // Get the user session (for user ID in handler)
    const session = await getServerSession();

    if (!session?.user?.id) {
      // This should not happen as withPermission handles auth, but keep for safety
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // Fetch user's language preference from database
    const userRows = await db
      .select({ locale: users.locale })
      .from(users)
      .where(eq(users.id, parseInt(session.user.id)))
      .limit(1);

    if (userRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    const user = userRows[0]!;
    const language = user.locale || 'en'; // Default to English if no locale set

    return NextResponse.json({
      success: true,
      language: language,
      message: 'User language preference retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching user language preference:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch user language preference',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};

const updateLanguageHandler = async (request: NextRequest) => {
  try {
    // Get the user session (for user ID in handler)
    const session = await getServerSession();

    if (!session?.user?.id) {
      // This should not happen as withPermission handles auth, but keep for safety
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { language } = body;

    if (!language) {
      return NextResponse.json(
        {
          success: false,
          message: 'Language is required',
        },
        { status: 400 }
      );
    }

    // Validate language (you can extend this list)
    const validLanguages = ['en', 'ar'];
    if (!validLanguages.includes(language)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid language. Supported languages: en, ar',
        },
        { status: 400 }
      );
    }

    // Update user's language preference in database
    const updatedUserRows = await db
      .update(users)
      .set({
        locale: language,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, parseInt(session.user.id)))
      .returning({
        id: users.id,
        locale: users.locale,
      });

    if (updatedUserRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to update user language preference',
        },
        { status: 500 }
      );
    }

    const updatedUser = updatedUserRows[0]!;

    return NextResponse.json({
      success: true,
      language: updatedUser.locale,
      message: 'User language preference updated successfully',
    });
  } catch (error) {
    console.error('Error updating user language preference:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update user language preference',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};

export const GET = withPermission(PermissionConfigs['own-profile'].read)(getLanguageHandler);
export const PUT = withPermission(PermissionConfigs['own-profile'].update)(updateLanguageHandler);
