
import { getServerSession } from '@/lib/auth';
import { getDb } from '@/lib/drizzle';
import { notifications } from '@/lib/drizzle/schema';
import { and, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST({ params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Update notification as read
    const result = await db
      .update(notifications)
      .set({
        read: true,
        readAt: sql`CURRENT_TIMESTAMP`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(and(eq(notifications.id, parseInt(id)), eq(notifications.userEmail, session.user.email)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
      data: {
        notification_id: id,
        read: true,
      },
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
  }
}
