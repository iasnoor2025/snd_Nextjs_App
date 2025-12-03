
import { getServerSession } from '@/lib/auth';
import { getDb } from '@/lib/drizzle';
import { notifications } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function DELETE() {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Get count before deletion
    const notificationsToDelete = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userEmail, session.user.email));

    const count = notificationsToDelete.length;

    // Delete all notifications for this user
    await db.delete(notifications).where(eq(notifications.userEmail, session.user.email));

    return NextResponse.json({
      success: true,
      message: 'All notifications cleared successfully',
      data: {
        user_email: session.user.email,
        cleared_count: count,
      },
    });
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    return NextResponse.json({ error: 'Failed to clear all notifications' }, { status: 500 });
  }
}
