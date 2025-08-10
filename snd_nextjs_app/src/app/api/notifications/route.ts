import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { eq, desc, and, sql } from 'drizzle-orm';
import { notifications } from '@/lib/drizzle/schema';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '50');
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const userEmail = session.user.email;

    try {
      // Build where conditions
      const whereConditions = unreadOnly 
        ? and(eq(notifications.userEmail, userEmail), eq(notifications.read, false))
        : eq(notifications.userEmail, userEmail);

      // Get notifications with pagination
      const notificationsResult = await db
        .select()
        .from(notifications)
        .where(whereConditions)
        .orderBy(desc(notifications.createdAt))
        .limit(perPage)
        .offset((page - 1) * perPage);

      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(whereConditions);

      const total = countResult[0]?.count || 0;
      const totalPages = Math.ceil(total / perPage);

      return NextResponse.json({
        success: true,
        data: {
          notifications: notificationsResult.map(notification => ({
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            timestamp: notification.timestamp,
            read: notification.read,
            action_url: notification.actionUrl,
            priority: notification.priority,
          })),
          pagination: {
            current_page: page,
            last_page: totalPages,
            per_page: perPage,
            total: total,
            from: total > 0 ? (page - 1) * perPage + 1 : 0,
            to: Math.min(page * perPage, total),
          },
        },
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // If table doesn't exist yet, return empty result
      return NextResponse.json({
        success: true,
        data: {
          notifications: [],
          pagination: {
            current_page: page,
            last_page: 1,
            per_page: perPage,
            total: 0,
            from: 0,
            to: 0,
          },
        },
      });
    }

  } catch (error) {
    console.error('Notification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 