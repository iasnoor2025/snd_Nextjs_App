import { getServerSession } from '@/lib/auth';
import { getDb } from '@/lib/drizzle';
import {
  conversations,
  conversationParticipants,
  users,
  messages,
  messageReads,
} from '@/lib/drizzle/schema';
import { and, desc, eq, sql, or, inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Get all conversations where user is a participant
    const userConversationIds = await db
      .select({ conversationId: conversationParticipants.conversationId })
      .from(conversationParticipants)
      .where(eq(conversationParticipants.userId, currentUserId));

    if (userConversationIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const conversationIds = userConversationIds.map(c => c.conversationId);

    // Get conversations
    const userConversations = await db
      .select()
      .from(conversations)
      .where(inArray(conversations.id, conversationIds))
      .orderBy(desc(conversations.lastMessageAt))
      .orderBy(desc(conversations.updatedAt));

    // Get participants and last messages for each conversation
    const conversationsWithParticipants = await Promise.all(
      userConversations.map(async conv => {
        // Get participants
        const participants = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            avatar: users.avatar,
          })
          .from(conversationParticipants)
          .innerJoin(users, eq(users.id, conversationParticipants.userId))
          .where(eq(conversationParticipants.conversationId, conv.id));

        // Get last message
        const [lastMessage] = await db
          .select({
            id: messages.id,
            content: messages.content,
            createdAt: messages.createdAt,
            senderId: messages.senderId,
          })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, conv.id),
              eq(messages.isDeleted, false)
            )
          )
          .orderBy(desc(messages.createdAt))
          .limit(1);

        // Get unread count
        const unreadMessages = await db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, conv.id),
              sql`${messages.senderId} != ${currentUserId}`,
              eq(messages.isDeleted, false),
              sql`NOT EXISTS (
                SELECT 1 FROM ${messageReads}
                WHERE ${messageReads.messageId} = ${messages.id}
                  AND ${messageReads.userId} = ${currentUserId}
              )`
            )
          );

        // Get current user's participant info to check mute status
        const currentUserParticipant = await db
          .select({ isMuted: conversationParticipants.isMuted })
          .from(conversationParticipants)
          .where(
            and(
              eq(conversationParticipants.conversationId, conv.id),
              eq(conversationParticipants.userId, currentUserId)
            )
          )
          .limit(1);

        // For direct messages, get the other participant's name
        let displayName = conv.name;
        if (conv.type === 'direct' && participants.length === 2) {
          const otherParticipant = participants.find(p => p.id !== currentUserId);
          displayName = otherParticipant?.name || otherParticipant?.email || 'Unknown';
        }

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
          id: conv.id,
          type: conv.type,
          name: displayName,
          participants,
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                content: lastMessage.content,
                createdAt: toISO(lastMessage.createdAt) || new Date().toISOString(),
                senderId: lastMessage.senderId,
              }
            : null,
          unreadCount: Number(unreadMessages[0]?.count) || 0,
          updatedAt: toISO(conv.updatedAt),
          lastMessageAt: toISO(conv.lastMessageAt),
          isMuted: currentUserParticipant[0]?.isMuted || false,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: conversationsWithParticipants,
    });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    // Check if it's a database table error
    if (error?.message?.includes('does not exist') || error?.message?.includes('relation')) {
      return NextResponse.json(
        {
          error: 'Database tables not found. Please run the migration: npx drizzle-kit push',
          details: error.message,
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const body = await request.json();
    const { type = 'direct', participantIds, name } = body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json({ error: 'Participant IDs are required' }, { status: 400 });
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

    // For direct messages, check if conversation already exists
    if (type === 'direct' && participantIds.length === 1) {
      const existingConversation = await db
        .select({
          conversationId: conversationParticipants.conversationId,
        })
        .from(conversationParticipants)
        .innerJoin(conversations, eq(conversations.id, conversationParticipants.conversationId))
        .where(
          and(
            eq(conversations.type, 'direct'),
            or(
              and(
                eq(conversationParticipants.userId, currentUserId),
                sql`EXISTS (
                  SELECT 1 FROM ${conversationParticipants} cp2
                  WHERE cp2.conversation_id = ${conversationParticipants.conversationId}
                    AND cp2.user_id = ${participantIds[0]}
                )`
              )
            )
          )
        )
        .limit(1);

      if (existingConversation.length > 0) {
        return NextResponse.json({
          success: true,
          data: { id: existingConversation[0].conversationId },
          message: 'Conversation already exists',
        });
      }
    }

    // Create conversation
    const [newConversation] = await db
      .insert(conversations)
      .values({
        type,
        name: type === 'group' ? name : null,
        createdBy: currentUserId,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .returning();

    // Add participants
    const allParticipantIds = [currentUserId, ...participantIds];
    await db.insert(conversationParticipants).values(
      allParticipantIds.map(userId => ({
        conversationId: newConversation.id,
        userId,
        joinedAt: sql`CURRENT_TIMESTAMP`,
      }))
    );

    return NextResponse.json({
      success: true,
      data: { id: newConversation.id },
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

