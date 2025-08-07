import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';

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

export interface UseSSEOptions {
  url?: string;
  enabled?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onEvent?: (event: SSEEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  eventTypes?: SSEEventType[];
  showToasts?: boolean;
}

export interface UseSSEReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastEvent: SSEEvent | null;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

export function useSSE(options: UseSSEOptions = {}): UseSSEReturn {
  const {
    url = '/api/sse',
    enabled = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onEvent,
    onConnect,
    onDisconnect,
    onError,
    eventTypes = [],
    showToasts = true
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const eventListenersRef = useRef<Map<string, (event: any) => void>>(new Map());

  // Enhanced cleanup function
  const cleanup = useCallback(() => {
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Abort controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Close EventSource and remove all listeners
    if (eventSourceRef.current) {
      const eventSource = eventSourceRef.current;
      
      // Remove all stored event listeners
      eventListenersRef.current.forEach((listener, eventType) => {
        eventSource.removeEventListener(eventType, listener);
      });
      eventListenersRef.current.clear();
      
      eventSource.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  // Handle event with mount check
  const handleEvent = useCallback((event: MessageEvent) => {
    if (!isMountedRef.current) return;

    try {
      const sseEvent: SSEEvent = JSON.parse(event.data);
      
      // Filter events by type if specified
      if (eventTypes.length > 0 && !eventTypes.includes(sseEvent.type)) {
        return;
      }

      setLastEvent(sseEvent);
      onEvent?.(sseEvent);

      // Show toast notifications for certain events
      if (showToasts) {
        switch (sseEvent.type) {
          case 'rental_status_updated':
            toast.success(`Rental status updated: ${sseEvent.data.status}`);
            break;
          case 'payment_received':
            toast.success(`Payment received: $${sseEvent.data.amount}`);
            break;
          case 'maintenance_required':
            toast.warning(`Maintenance required: ${sseEvent.data.equipment_name}`);
            break;
          case 'rental_overdue':
            toast.error('Rental is now overdue!');
            break;
          case 'payroll_processed':
            toast.success('Payroll processed successfully');
            break;
          case 'timesheet_updated':
            toast.info('Timesheet updated');
            break;
          case 'leave_request_updated':
            toast.info('Leave request status updated');
            break;
          case 'sync_progress':
            if (sseEvent.data.progress === 100) {
              toast.success('Sync completed successfully');
            } else if (sseEvent.data.progress > 0) {
              toast.info(`Sync progress: ${sseEvent.data.progress}%`);
            }
            break;
        }
      }
    } catch (error) {
      console.error('Error parsing SSE event:', error);
    }
  }, [onEvent, eventTypes, showToasts]);

  // Handle connection open with mount check
  const handleOpen = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setIsConnected(true);
    setIsConnecting(false);
    setError(null);
    setReconnectAttempts(0);
    onConnect?.();
    
    if (showToasts) {
      toast.success('Real-time connection established');
    }
  }, [onConnect, showToasts]);

  // Handle connection error with mount check
  const handleError = useCallback((event: Event) => {
    if (!isMountedRef.current) return;
    
    setIsConnected(false);
    setIsConnecting(false);
    setError('Connection error occurred');
    onError?.(event);
    
    if (showToasts) {
      toast.error('Real-time connection lost');
    }

    // Attempt to reconnect if enabled and under max attempts
    if (enabled && reconnectAttempts < maxReconnectAttempts) {
      setReconnectAttempts(prev => prev + 1);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          connect();
        }
      }, reconnectInterval);
    }
  }, [enabled, reconnectAttempts, maxReconnectAttempts, reconnectInterval, onError, showToasts]);

  // Connect function with improved error handling
  const connect = useCallback(() => {
    if (isConnected || isConnecting || !isMountedRef.current) return;

    cleanup();
    setIsConnecting(true);
    setError(null);

    try {
      // Create abort controller for cleanup
      abortControllerRef.current = new AbortController();

      // Create EventSource
      const eventSource = new EventSource(url, {
        withCredentials: true
      });

      eventSourceRef.current = eventSource;

      // Store event listeners for proper cleanup
      const openListener = (event: Event) => handleOpen();
      const errorListener = (event: Event) => handleError(event);
      const messageListener = (event: MessageEvent) => handleEvent(event);

      eventListenersRef.current.set('open', openListener);
      eventListenersRef.current.set('error', errorListener);
      eventListenersRef.current.set('message', messageListener);

      // Set up event listeners
      eventSource.addEventListener('open', openListener);
      eventSource.addEventListener('error', errorListener);
      eventSource.addEventListener('message', messageListener);

      // Set up specific event listeners for each event type
      const allEventTypes: SSEEventType[] = [
        'rental_status_updated',
        'payment_received',
        'maintenance_required',
        'rental_overdue',
        'equipment_location_updated',
        'timesheet_updated',
        'payroll_processed',
        'leave_request_updated',
        'system_notification',
        'sync_progress'
      ];

      allEventTypes.forEach(eventType => {
        const listener = (event: MessageEvent) => handleEvent(event);
        eventListenersRef.current.set(eventType, listener);
        eventSource.addEventListener(eventType, listener);
      });

      // Handle abort
      abortControllerRef.current.signal.addEventListener('abort', () => {
        eventSource.close();
      });

    } catch (error) {
      setIsConnecting(false);
      setError('Failed to establish connection');
      console.error('SSE connection error:', error);
    }
  }, [url, isConnected, isConnecting, handleOpen, handleError, handleEvent, cleanup, enabled, reconnectAttempts, maxReconnectAttempts, reconnectInterval]);

  // Disconnect function
  const disconnect = useCallback(() => {
    cleanup();
    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
    setReconnectAttempts(0);
    onDisconnect?.();
    
    if (showToasts) {
      toast.info('Real-time connection closed');
    }
  }, [cleanup, onDisconnect, showToasts]);

  // Reconnect function
  const reconnect = useCallback(() => {
    if (!isMountedRef.current) return;
    disconnect();
    setTimeout(() => {
      if (isMountedRef.current) {
        connect();
      }
    }, 1000);
  }, [disconnect, connect]);

  // Component mount/unmount tracking
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  // Auto-connect when enabled
  useEffect(() => {
    if (enabled && isMountedRef.current) {
      connect();
    } else {
      disconnect();
    }
  }, [enabled, connect, disconnect]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, keep connection but don't show toasts
        if (showToasts) {
          toast.info('App running in background');
        }
      } else {
        // Page is visible again, reconnect if needed
        if (enabled && !isConnected && !isConnecting && isMountedRef.current) {
          connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, isConnected, isConnecting, connect, showToasts]);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      cleanup();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [cleanup]);

  return {
    isConnected,
    isConnecting,
    error,
    lastEvent,
    connect,
    disconnect,
    reconnect
  };
} 