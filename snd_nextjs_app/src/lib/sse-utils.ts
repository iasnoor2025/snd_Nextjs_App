import { ReadableStreamDefaultController } from 'stream/web';

// Store active connections
export const connections = new Set<ReadableStreamDefaultController>();

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
  | 'sync_progress';

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
