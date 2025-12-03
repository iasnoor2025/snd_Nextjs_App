import { getServerSession } from '@/lib/auth';
import { getDb } from '@/lib/drizzle';
import { conversationParticipants, users } from '@/lib/drizzle/schema';
import { and, eq } from 'drizzle-orm';
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
    const { muted } = body;

    if (typeof muted !== 'boolean') {
      return NextResponse.json({ error: 'muted parameter is required (boolean)' }, { status: 400 });
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

    // Update mute status
    const [updated] = await db
      .update(conversationParticipants)
      .set({ isMuted: muted })
      .where(
        and(
          eq(conversationParticipants.conversationId, parseInt(id)),
          eq(conversationParticipants.userId, currentUserId)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { isMuted: updated.isMuted },
    });
  } catch (error) {
    console.error('Error updating mute status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

