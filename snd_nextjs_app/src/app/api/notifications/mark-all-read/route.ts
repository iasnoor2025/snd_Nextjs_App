
import { getServerSession } from '@/lib/auth';
import { getDb } from '@/lib/drizzle';
import { notifications } from '@/lib/drizzle/schema';
import { and, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Update all unread notifications for this user
    const result = await db
      .update(notifications)
      .set({
        read: true,
        readAt: sql`CURRENT_TIMESTAMP`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(and(eq(notifications.userEmail, session.user.email), eq(notifications.read, false)))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read',
      data: {
        user_email: session.user.email,
        marked_count: result.length,
      },
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}
