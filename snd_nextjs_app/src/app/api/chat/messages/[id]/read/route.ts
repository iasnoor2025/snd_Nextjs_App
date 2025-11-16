import { getServerSession } from '@/lib/auth';
import { getDb } from '@/lib/drizzle';
import { messageReads, messages, users, conversationParticipants } from '@/lib/drizzle/schema';
import { and, eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

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

    // Check if message exists
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, parseInt(id)))
      .limit(1);

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user is a participant in the conversation
    const participant = await db
      .select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, message.conversationId),
          eq(conversationParticipants.userId, currentUserId)
        )
      )
      .limit(1);

    if (participant.length === 0) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    // Check if already read
    const existingRead = await db
      .select()
      .from(messageReads)
      .where(and(eq(messageReads.messageId, parseInt(id)), eq(messageReads.userId, currentUserId)))
      .limit(1);

    if (existingRead.length > 0) {
      return NextResponse.json({
        success: true,
        data: existingRead[0],
        message: 'Message already marked as read',
      });
    }

    // Mark as read
    const [readReceipt] = await db
      .insert(messageReads)
      .values({
        messageId: parseInt(id),
        userId: currentUserId,
        readAt: sql`CURRENT_TIMESTAMP`,
      })
      .returning();

    // Update participant's lastReadAt
    await db
      .update(conversationParticipants)
      .set({
        lastReadAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(
        and(
          eq(conversationParticipants.conversationId, message.conversationId),
          eq(conversationParticipants.userId, currentUserId)
        )
      );

    return NextResponse.json({
      success: true,
      data: readReceipt,
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

