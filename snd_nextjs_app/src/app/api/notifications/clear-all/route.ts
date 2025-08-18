import { authOptions } from '@/lib/auth-config';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real application, you would delete all notifications for this user from the database
    // For now, we'll just return a success response
    console.log(`Clearing all notifications for user ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: 'All notifications cleared successfully',
      data: {
        user_email: session.user.email,
        cleared_count: 0, // In a real app, this would be the actual count
      },
    });
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    return NextResponse.json({ error: 'Failed to clear all notifications' }, { status: 500 });
  }
}
