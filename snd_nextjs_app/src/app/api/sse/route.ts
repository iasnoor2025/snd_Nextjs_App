import { NextRequest, NextResponse } from 'next/server';
import { connections, sendEventToClient, broadcastEvent, type SSEEvent, type SSEEventType } from '@/lib/sse-utils';

export async function GET(request: NextRequest) {
  // Set headers for SSE
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  };

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Add this connection to the set
      connections.add(controller);

      // Send initial connection event
      const connectionEvent: SSEEvent = {
        type: 'system_notification',
        data: {
          message: 'SSE connection established',
          status: 'connected'
        },
        timestamp: new Date().toISOString(),
        id: 'connection-established'
      };

      sendEventToClient(controller, connectionEvent);

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeatInterval = setInterval(() => {
        const heartbeatEvent: SSEEvent = {
          type: 'system_notification',
          data: {
            message: 'heartbeat',
            status: 'alive'
          },
          timestamp: new Date().toISOString(),
          id: 'heartbeat'
        };

        sendEventToClient(controller, heartbeatEvent);
      }, 30000);

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        connections.delete(controller);
        clearInterval(heartbeatInterval);
        controller.close();
      });
    },
    cancel(controller) {
      connections.delete(controller);
    }
  });

  return new Response(stream, { headers });
}

// POST endpoint for sending events (for testing and server-side events)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, id } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: type and data' },
        { status: 400 }
      );
    }

    const event: SSEEvent = {
      type: type as SSEEventType,
      data,
      timestamp: new Date().toISOString(),
      id
    };

    // Broadcast the event to all connected clients
    broadcastEvent(event);

    return NextResponse.json({ 
      success: true, 
      message: 'Event broadcasted successfully',
      connectionsCount: connections.size
    });
  } catch (error) {
    console.error('Error handling SSE POST request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 