
import { getServerSession } from '@/lib/auth';
import { getDb } from '@/lib/drizzle';
import { notifications } from '@/lib/drizzle/schema';
import { and, desc, eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Get query parameters
    const { searchParams } = new URL(_request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '50');
    const unreadOnly = searchParams.get('unread_only') === 'true';

    // Build where conditions
    const conditions = [eq(notifications.userEmail, session.user.email)];
    if (unreadOnly) {
      conditions.push(eq(notifications.read, false));
    }

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(...conditions));

    const total = Number(totalResult[0]?.count || 0);
    const lastPage = Math.ceil(total / perPage);
    const offset = (page - 1) * perPage;

    // Get notifications
    const notificationsList = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(perPage)
      .offset(offset);

    // Transform notifications to match frontend format
    const formattedNotifications = notificationsList.map(notif => ({
      id: String(notif.id),
      type: notif.type as 'info' | 'success' | 'warning' | 'error',
      title: notif.title,
      message: notif.message,
      data: notif.data || {},
      timestamp: new Date(notif.createdAt),
      read: notif.read,
      action_url: notif.actionUrl || undefined,
      priority: notif.priority as 'low' | 'medium' | 'high',
    }));

    return NextResponse.json({
      success: true,
      data: {
        notifications: formattedNotifications,
        pagination: {
          current_page: page,
          last_page: lastPage,
          per_page: perPage,
          total,
          from: offset + 1,
          to: Math.min(offset + perPage, total),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
