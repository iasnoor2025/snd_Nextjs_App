import { getServerSession } from '@/lib/auth';
import { getDb } from '@/lib/drizzle';
import {
  conversations,
  conversationParticipants,
  messages,
  messageReads,
  users,
} from '@/lib/drizzle/schema';
import { and, desc, eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '50');
    const before = searchParams.get('before'); // Message ID to fetch messages before

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

    // Check if user is a participant
    const participant = await db
      .select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, parseInt(id)),
          eq(conversationParticipants.userId, currentUserId)
        )
      )
      .limit(1);

    if (participant.length === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Build where conditions
    const conditions = [
      eq(messages.conversationId, parseInt(id)),
      eq(messages.isDeleted, false),
    ];

    if (before) {
      conditions.push(sql`${messages.id} < ${parseInt(before)}`);
    }

    // Get messages
    const messagesList = await db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        content: messages.content,
        messageType: messages.messageType,
        fileUrl: messages.fileUrl,
        fileName: messages.fileName,
        fileSize: messages.fileSize,
        replyToId: messages.replyToId,
        isEdited: messages.isEdited,
        isDeleted: messages.isDeleted,
        deletedAt: messages.deletedAt,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        sender: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatar: users.avatar,
        },
        isRead: sql<boolean>`EXISTS (
          SELECT 1 FROM ${messageReads}
          WHERE ${messageReads.messageId} = ${messages.id}
            AND ${messageReads.userId} = ${currentUserId}
        )`,
      })
      .from(messages)
      .innerJoin(users, eq(users.id, messages.senderId))
      .where(and(...conditions))
      .orderBy(desc(messages.createdAt))
      .limit(perPage);

    // Reverse to show oldest first
    const reversedMessages = messagesList.reverse();

    // Ensure all timestamps are in ISO format (UTC)
    const formattedMessages = reversedMessages.map(msg => {
      // Helper to convert database timestamp to ISO string
      const toISO = (ts: any): string | null => {
        if (!ts) return null;
        try {
          // If it's already an ISO string, return it
          if (typeof ts === 'string' && (ts.includes('Z') || ts.includes('+') || ts.includes('T'))) {
            return new Date(ts).toISOString();
          }
          // If it's a database timestamp string without timezone, treat as UTC
          if (typeof ts === 'string') {
            // PostgreSQL timestamp format: "2025-11-16 07:38:30.123"
            // Append 'Z' to treat as UTC
            return new Date(ts + (ts.includes('Z') || ts.includes('+') ? '' : 'Z')).toISOString();
          }
          // If it's a Date object or number
          return new Date(ts).toISOString();
        } catch (e) {
          console.error('Error converting timestamp:', ts, e);
          return new Date().toISOString();
        }
      };

      return {
        ...msg,
        createdAt: toISO(msg.createdAt) || new Date().toISOString(),
        updatedAt: toISO(msg.updatedAt) || new Date().toISOString(),
        deletedAt: toISO(msg.deletedAt),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        messages: formattedMessages,
        pagination: {
          hasMore: messagesList.length === perPage,
          nextCursor: messagesList.length > 0 ? messagesList[messagesList.length - 1].id : null,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const body = await request.json();
    const { content, messageType = 'text', fileUrl, fileName, fileSize, replyToId } = body;

    // Content is required unless there's a file (image or file message)
    if ((!content || content.trim().length === 0) && !fileUrl) {
      return NextResponse.json(
        { error: 'Message content or file is required' },
        { status: 400 }
      );
    }

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

    // Check if user is a participant
    const participant = await db
      .select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, parseInt(id)),
          eq(conversationParticipants.userId, currentUserId)
        )
      )
      .limit(1);

    if (participant.length === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Create message with explicit ISO timestamp
    const now = new Date().toISOString();
    const [newMessage] = await db
      .insert(messages)
      .values({
        conversationId: parseInt(id),
        senderId: currentUserId,
        content: content?.trim() || (fileUrl ? (fileName || 'Image') : ''),
        messageType,
        fileUrl,
        fileName,
        fileSize,
        replyToId: replyToId ? parseInt(replyToId) : null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Update conversation's lastMessageAt
    await db
      .update(conversations)
      .set({
        lastMessageAt: sql`CURRENT_TIMESTAMP`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(conversations.id, parseInt(id)));

    // Get sender info
    const [sender] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
      })
      .from(users)
      .where(eq(users.id, currentUserId))
      .limit(1);

    // Get all participants to broadcast the message
    const participants = await db
      .select({ userId: conversationParticipants.userId })
      .from(conversationParticipants)
      .where(eq(conversationParticipants.conversationId, parseInt(id)));

    // Broadcast chat message event via SSE
    try {
      const { sendEventToUsers } = await import('@/lib/sse-utils');
      sendEventToUsers(
        participants.map(p => p.userId),
        {
          type: 'chat:message',
          data: {
            message: {
              ...newMessage,
              sender,
              isRead: false,
            },
            conversationId: parseInt(id),
          },
          timestamp: new Date().toISOString(),
          id: String(newMessage.id),
        }
      );
    } catch (error) {
      console.error('Error broadcasting chat message:', error);
      // Don't fail the request if SSE broadcast fails
    }

    // Ensure timestamps are in ISO format (already set above, but ensure consistency)
    const formattedMessage = {
      ...newMessage,
      createdAt: newMessage.createdAt ? (typeof newMessage.createdAt === 'string' ? newMessage.createdAt : new Date(newMessage.createdAt).toISOString()) : now,
      updatedAt: newMessage.updatedAt ? (typeof newMessage.updatedAt === 'string' ? newMessage.updatedAt : new Date(newMessage.updatedAt).toISOString()) : now,
      deletedAt: newMessage.deletedAt ? (typeof newMessage.deletedAt === 'string' ? newMessage.deletedAt : new Date(newMessage.deletedAt).toISOString()) : null,
      sender,
      isRead: false,
    };

    return NextResponse.json({
      success: true,
      data: formattedMessage,
    });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

