import { ReadableStreamDefaultController } from 'stream/web';

// Store active connections
export const connections = new Set<ReadableStreamDefaultController>();

// Store user-specific connections (userId -> Set of controllers)
export const userConnections = new Map<string | number, Set<ReadableStreamDefaultController>>();

// Event types for the rental management system
export type SSEEventType =
  | 'rental_status_updated'
  | 'payment_received'
  | 'maintenance_required'
  | 'rental_overdue'
  | 'equipment_location_updated'
  | 'timesheet_updated'
  | 'payroll_processed'
  | 'leave_request_updated'
  | 'system_notification'
  | 'sync_progress'
  | 'chat:message'
  | 'chat:message_edited'
  | 'chat:message_deleted'
  | 'chat:typing'
  | 'chat:read_receipt';

export interface SSEEvent {
  type: SSEEventType;
  data: any;
  timestamp: string;
  id?: string;
}

// Helper function to send event to all connected clients
export function broadcastEvent(event: SSEEvent) {
  const eventString =
    `id: ${event.id || Date.now()}\n` +
    `event: ${event.type}\n` +
    `data: ${JSON.stringify(event)}\n` +
    `retry: 3000\n\n`;

  connections.forEach(controller => {
    try {
      controller.enqueue(new TextEncoder().encode(eventString));
    } catch (error) {
      
    }
  });
}

// Helper function to send event to specific client
export function sendEventToClient(controller: ReadableStreamDefaultController, event: SSEEvent) {
  const eventString =
    `id: ${event.id || Date.now()}\n` +
    `event: ${event.type}\n` +
    `data: ${JSON.stringify(event)}\n` +
    `retry: 3000\n\n`;

  try {
    controller.enqueue(new TextEncoder().encode(eventString));
  } catch (error) {
    
  }
}

// Register user connection
export function registerUserConnection(
  userId: string | number,
  controller: ReadableStreamDefaultController
) {
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set());
  }
  userConnections.get(userId)!.add(controller);
  connections.add(controller);
}

// Unregister user connection
export function unregisterUserConnection(
  userId: string | number,
  controller: ReadableStreamDefaultController
) {
  const userConns = userConnections.get(userId);
  if (userConns) {
    userConns.delete(controller);
    if (userConns.size === 0) {
      userConnections.delete(userId);
    }
  }
  connections.delete(controller);
}

// Send event to specific user(s)
export function sendEventToUsers(userIds: (string | number)[], event: SSEEvent) {
  const eventString =
    `id: ${event.id || Date.now()}\n` +
    `event: ${event.type}\n` +
    `data: ${JSON.stringify(event)}\n` +
    `retry: 3000\n\n`;

  const sentTo = new Set<ReadableStreamDefaultController>();

  userIds.forEach(userId => {
    const userConns = userConnections.get(userId);
    if (userConns) {
      userConns.forEach(controller => {
        if (!sentTo.has(controller)) {
          try {
            controller.enqueue(new TextEncoder().encode(eventString));
            sentTo.add(controller);
          } catch (error) {
            // Connection closed, remove it
            userConns.delete(controller);
            connections.delete(controller);
          }
        }
      });
    }
  });
}
