import { getServerSession } from '@/lib/auth';
import { getDb } from '@/lib/drizzle';
import { conversationParticipants, users } from '@/lib/drizzle/schema';
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
    const body = await request.json();
    const { isTyping } = body;

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Get current user ID
    const userResult = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentUser = userResult[0];

    // Check if user is a participant
    const participant = await db
      .select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, parseInt(id)),
          eq(conversationParticipants.userId, currentUser.id)
        )
      )
      .limit(1);

    if (participant.length === 0) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    // Get all participants except the current user
    const otherParticipants = await db
      .select({ userId: conversationParticipants.userId })
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, parseInt(id)),
          sql`${conversationParticipants.userId} != ${currentUser.id}`
        )
      );

    // Broadcast typing event to other participants
    if (otherParticipants.length > 0) {
      const { sendEventToUsers } = await import('@/lib/sse-utils');
      sendEventToUsers(
        otherParticipants.map(p => p.userId),
        {
          type: 'chat:typing',
          data: {
            conversationId: parseInt(id),
            userId: currentUser.id,
            userName: currentUser.name || currentUser.email,
            isTyping,
          },
          timestamp: new Date().toISOString(),
          id: `typing-${currentUser.id}-${parseInt(id)}-${Date.now()}`,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: { isTyping },
    });
  } catch (error) {
    console.error('Error broadcasting typing event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

