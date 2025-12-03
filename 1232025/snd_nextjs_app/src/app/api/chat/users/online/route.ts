import { getServerSession } from '@/lib/auth';
import { getDb } from '@/lib/drizzle';
import { users } from '@/lib/drizzle/schema';
import { getOnlineUserIds, isUserOnline } from '@/lib/sse-utils';
import { eq, inArray } from 'drizzle-orm';
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

    // Get query params for specific user IDs
    const { searchParams } = new URL(request.url);
    const userIdsParam = searchParams.get('userIds');
    const userIds = userIdsParam ? userIdsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : null;

    // Get online user IDs from SSE connections
    const onlineUserIds = getOnlineUserIds().map(id => Number(id));

    if (userIds && userIds.length > 0) {
      // Return status for specific users
      const statusMap: Record<number, boolean> = {};
      userIds.forEach(userId => {
        statusMap[userId] = isUserOnline(userId);
      });

      return NextResponse.json({
        success: true,
        data: statusMap,
      });
    }

    // Return all online users with their info
    if (onlineUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const onlineUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
      })
      .from(users)
      .where(inArray(users.id, onlineUserIds));

    return NextResponse.json({
      success: true,
      data: onlineUsers,
    });
  } catch (error) {
    console.error('Error fetching online users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

