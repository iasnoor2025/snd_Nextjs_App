'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSSE, SSEEvent, SSEEventType } from '@/hooks/use-sse';
import { toast } from 'sonner';

interface SSEContextType {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastEvent: SSEEvent | null;
  events: SSEEvent[];
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  clearEvents: () => void;
  sendEvent: (type: SSEEventType, data: any) => Promise<void>;
}

const SSEContext = createContext<SSEContextType | undefined>(undefined);

interface SSEProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
  maxEvents?: number;
  showToasts?: boolean;
}

export function SSEProvider({ 
  children, 
  enabled = true, 
  maxEvents = 100,
  showToasts = true 
}: SSEProviderProps) {
  const [events, setEvents] = useState<SSEEvent[]>([]);

  const {
    isConnected,
    isConnecting,
    error,
    lastEvent,
    connect,
    disconnect,
    reconnect
  } = useSSE({
    enabled,
    showToasts,
    onEvent: (event) => {
      setEvents(prev => {
        const newEvents = [event, ...prev];
        // Keep only the last maxEvents
        return newEvents.slice(0, maxEvents);
      });
    },
    onConnect: () => {
      console.log('SSE connected');
    },
    onDisconnect: () => {
      console.log('SSE disconnected');
    },
    onError: (error) => {
      console.error('SSE error:', error);
    }
  });

  // Send event function
  const sendEvent = async (type: SSEEventType, data: any) => {
    try {
      const response = await fetch('/api/sse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data,
          id: `${type}-${Date.now()}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send event');
      }

      const result = await response.json();
      console.log('Event sent successfully:', result);
    } catch (error) {
      console.error('Error sending event:', error);
      toast.error('Failed to send event');
    }
  };

  // Clear events function
  const clearEvents = () => {
    setEvents([]);
  };

  const value: SSEContextType = {
    isConnected,
    isConnecting,
    error,
    lastEvent,
    events,
    connect,
    disconnect,
    reconnect,
    clearEvents,
    sendEvent
  };

  return (
    <SSEContext.Provider value={value}>
      {children}
    </SSEContext.Provider>
  );
}

export function useSSEContext() {
  const context = useContext(SSEContext);
  if (context === undefined) {
    throw new Error('useSSEContext must be used within a SSEProvider');
  }
  return context;
}

// Hook for specific event types
export function useSSEEvents(eventTypes: SSEEventType[]) {
  const { events } = useSSEContext();
  return events.filter(event => eventTypes.includes(event.type));
}

// Hook for rental events
export function useRentalEvents() {
  return useSSEEvents([
    'rental_status_updated',
    'payment_received',
    'maintenance_required',
    'rental_overdue'
  ]);
}

// Hook for employee events
export function useEmployeeEvents() {
  return useSSEEvents([
    'timesheet_updated',
    'payroll_processed',
    'leave_request_updated'
  ]);
}

// Hook for equipment events
export function useEquipmentEvents() {
  return useSSEEvents([
    'equipment_location_updated',
    'maintenance_required'
  ]);
}

// Hook for sync events
export function useSyncEvents() {
  return useSSEEvents(['sync_progress']);
} 