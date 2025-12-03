import { getServerSession } from '@/lib/auth';
import { getDb } from '@/lib/drizzle';
import { messages, users } from '@/lib/drizzle/schema';
import { and, eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
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
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
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

    // Check if message exists and belongs to user
    const [message] = await db
      .select()
      .from(messages)
      .where(and(eq(messages.id, parseInt(id)), eq(messages.senderId, currentUserId)))
      .limit(1);

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.isDeleted) {
      return NextResponse.json({ error: 'Cannot edit deleted message' }, { status: 400 });
    }

    // Update message
    const [updatedMessage] = await db
      .update(messages)
      .set({
        content: content.trim(),
        isEdited: true,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(messages.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedMessage,
    });
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Check if message exists and belongs to user
    const [message] = await db
      .select()
      .from(messages)
      .where(and(eq(messages.id, parseInt(id)), eq(messages.senderId, currentUserId)))
      .limit(1);

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Soft delete message
    const [deletedMessage] = await db
      .update(messages)
      .set({
        isDeleted: true,
        deletedAt: sql`CURRENT_TIMESTAMP`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(messages.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      success: true,
      data: deletedMessage,
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

