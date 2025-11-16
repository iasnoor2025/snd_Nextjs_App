
import { getServerSession } from '@/lib/auth';
import { getDb } from '@/lib/drizzle';
import { users } from '@/lib/drizzle/schema';
import { registerUserConnection, unregisterUserConnection } from '@/lib/sse-utils';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get user ID from database
    const db = getDb();
    let userId: number | null = null;
    if (db && session.user.email) {
      const userResult = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, session.user.email))
        .limit(1);
      if (userResult.length > 0) {
        userId = userResult[0].id;
      }
    }

    // Set SSE headers
    const response = new NextResponse(
      new ReadableStream({
        start(controller) {
          // Register user connection
          if (userId) {
            registerUserConnection(userId, controller);
          }

          // Send initial connection message
          const initialMessage = {
            type: 'connection',
            payload: {
              message: 'SSE connection established',
              userId: userId || session.user.id,
              timestamp: new Date().toISOString(),
            },
          };

          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(initialMessage)}\n\n`)
          );

          // Keep connection alive with heartbeat
          const heartbeat = setInterval(() => {
            const heartbeatMessage = {
              type: 'heartbeat',
              payload: {
                timestamp: new Date().toISOString(),
              },
            };

            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify(heartbeatMessage)}\n\n`)
            );
          }, 30000); // Send heartbeat every 30 seconds

          // Cleanup on close
          _request.signal.addEventListener('abort', () => {
            clearInterval(heartbeat);
            if (userId) {
              unregisterUserConnection(userId, controller);
            }
            controller.close();
          });
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Cache-Control',
        },
      }
    );

    return response;
  } catch (error) {
    console.error('SSE connection error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(_request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await _request.json();
    const { type, payload } = body;

    // Validate request
    if (!type || !payload) {
      return new NextResponse('Invalid request', { status: 400 });
    }

    // Here you would typically:
    // 1. Store the notification in the database
    // 2. Send it to the appropriate SSE connections
    // 3. Handle different notification types

    // For now, we'll just return success
    return NextResponse.json({
      success: true,
      message: 'Notification sent',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('SSE POST error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
