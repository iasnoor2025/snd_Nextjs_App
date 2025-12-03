import { getServerSession } from '@/lib/auth';
import { getDb } from '@/lib/drizzle';
import {
  messages,
  messageReads,
  conversationParticipants,
  notifications,
  users,
} from '@/lib/drizzle/schema';
import { and, eq, sql, notExists } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Mark all unread messages in a conversation as read
 * Also marks all chat notifications for this conversation as read
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Get current user ID
    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentUserId = userResult[0].id;
    const conversationId = parseInt(id);

    // Check if user is a participant
    const participant = await db
      .select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, currentUserId)
        )
      )
      .limit(1);

    if (participant.length === 0) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    // Get all unread messages in this conversation
    const unreadMessages = await db
      .select({ id: messages.id })
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, conversationId),
          sql`${messages.senderId} != ${currentUserId}`, // Not sent by current user
          eq(messages.isDeleted, false),
          notExists(
            db
              .select()
              .from(messageReads)
              .where(
                and(
                  eq(messageReads.messageId, messages.id),
                  eq(messageReads.userId, currentUserId)
                )
              )
          )
        )
      );

    // Mark all unread messages as read
    const now = new Date().toISOString();
    for (const msg of unreadMessages) {
      // Check if already read
      const existingRead = await db
        .select()
        .from(messageReads)
        .where(and(eq(messageReads.messageId, msg.id), eq(messageReads.userId, currentUserId)))
        .limit(1);

      if (existingRead.length === 0) {
        await db.insert(messageReads).values({
          messageId: msg.id,
          userId: currentUserId,
          readAt: sql`CURRENT_TIMESTAMP`,
        });
      }
    }

    // Update participant's lastReadAt
    await db
      .update(conversationParticipants)
      .set({
        lastReadAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, currentUserId)
        )
      );

    // Mark all chat notifications for this conversation as read
    // First get all notifications for this user
    const allNotifications = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userEmail, session.user.email),
          eq(notifications.read, false)
        )
      );

    // Filter for chat notifications matching this conversation
    const chatNotifications = allNotifications.filter(notif => {
      try {
        const data = typeof notif.data === 'string' ? JSON.parse(notif.data) : notif.data;
        return data?.type === 'chat' && data?.conversationId === conversationId;
      } catch {
        return false;
      }
    });

    // Mark matching notifications as read
    if (chatNotifications.length > 0) {
      const notificationIds = chatNotifications.map(n => n.id);
      // Update each notification individually to avoid SQL array issues
      for (const notifId of notificationIds) {
        await db
          .update(notifications)
          .set({
            read: true,
            readAt: sql`CURRENT_TIMESTAMP`,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(
            and(
              eq(notifications.id, notifId),
              eq(notifications.userEmail, session.user.email)
            )
          );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        conversationId,
        messagesMarked: unreadMessages.length,
      },
    });
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

