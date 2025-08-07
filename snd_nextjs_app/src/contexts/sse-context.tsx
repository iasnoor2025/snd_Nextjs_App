'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { ToastService } from '@/lib/toast-service';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  read: boolean;
  action_url?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface SSEContextType {
  notifications: Notification[];
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  unreadCount: number;
  reconnect: () => void;
}

const SSEContext = createContext<SSEContextType | undefined>(undefined);

export const useSSE = () => {
  const context = useContext(SSEContext);
  if (!context) {
    throw new Error('useSSE must be used within an SSEProvider');
  }
  return context;
};

// Alias for backward compatibility
export const useSSEContext = useSSE;

interface SSEProviderProps {
  children: React.ReactNode;
}

export const SSEProvider: React.FC<SSEProviderProps> = ({ children }) => {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [maxReconnectAttempts] = useState(3); // Reduced from 5 to 3
  const isMountedRef = useRef(true);
  const cleanupRef = useRef<(() => void) | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Optimized cleanup function - less aggressive
  const cleanup = useCallback(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, [eventSource]);

  // Handle SSE messages with performance optimization
  const handleSSEMessage = useCallback((data: any) => {
    if (!isMountedRef.current) return;
    
    switch (data.type) {
      case 'notification':
        handleNotification(data.payload);
        break;
      case 'system':
        handleSystemMessage(data.payload);
        break;
      case 'update':
        handleUpdate(data.payload);
        break;
      default:
        // Handle unknown message types
        break;
    }
  }, []);

  // Handle notification messages
  const handleNotification = useCallback((payload: any) => {
    if (!isMountedRef.current) return;

    const notification: Notification = {
      id: payload.id || Date.now().toString(),
      type: payload.type || 'info',
      title: payload.title || 'Notification',
      message: payload.message || '',
      data: payload.data,
      timestamp: new Date(payload.timestamp || Date.now()),
      read: false,
      action_url: payload.action_url,
      priority: payload.priority || 'medium',
    };

    setNotifications(prev => [notification, ...prev]);

    // Show toast notification only if page is visible
    if (!document.hidden) {
      switch (notification.type) {
        case 'success':
          ToastService.success(notification.message);
          break;
        case 'error':
          ToastService.error(notification.message);
          break;
        case 'warning':
          ToastService.warning(notification.message);
          break;
        case 'info':
          ToastService.info(notification.message);
          break;
      }
    }
  }, []);

  // Handle system messages
  const handleSystemMessage = useCallback((payload: any) => {
    if (!isMountedRef.current) return;
    
    switch (payload.action) {
      case 'reload':
        window.location.reload();
        break;
      case 'redirect':
        window.location.href = payload.url;
        break;
      case 'update_available':
        ToastService.info('System update available');
        break;
      default:
        // Handle unknown system actions
        break;
    }
  }, []);

  // Handle update messages
  const handleUpdate = useCallback((payload: any) => {
    if (!isMountedRef.current) return;
    
    // Handle different types of updates
    switch (payload.entity) {
      case 'employee':
        // Trigger employee data refresh
        break;
      case 'rental':
        // Trigger rental data refresh
        break;
      case 'equipment':
        // Trigger equipment data refresh
        break;
      default:
        // Handle unknown entity types
        break;
    }
  }, []);

  // Initialize SSE connection with performance optimization
  const connectSSE = useCallback(() => {
    if (!session?.user?.email || !isMountedRef.current) {
      setConnectionStatus('disconnected');
      return;
    }

    try {
      setConnectionStatus('connecting');
      
      // Close existing connection
      cleanup();

      // Add connection timeout for faster failure detection
      connectionTimeoutRef.current = setTimeout(() => {
        if (connectionStatus === 'connecting') {
          setConnectionStatus('error');
          setIsConnected(false);
        }
      }, 5000); // 5 second timeout

      // Create new EventSource connection
      const sse = new EventSource('/api/sse', {
        withCredentials: true,
      });

      const handleOpen = () => {
        if (!isMountedRef.current) {
          sse.close();
          return;
        }
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        setIsConnected(true);
        setConnectionStatus('connected');
        setReconnectAttempts(0);
        reconnectAttemptsRef.current = 0;
      };

      const handleMessage = (event: MessageEvent) => {
        if (!isMountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          handleSSEMessage(data);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      const handleError = (error: Event) => {
        if (!isMountedRef.current) return;
        console.error('SSE connection error:', error);
        setIsConnected(false);
        setConnectionStatus('error');
        
        // Reduced reconnection attempts for faster recovery
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          setTimeout(() => {
            if (isMountedRef.current) {
              connectSSE();
            }
          }, Math.pow(1.5, reconnectAttemptsRef.current) * 1000); // Reduced exponential backoff
          reconnectAttemptsRef.current += 1;
          setReconnectAttempts(reconnectAttemptsRef.current);
        }
      };

      sse.addEventListener('open', handleOpen);
      sse.addEventListener('message', handleMessage);
      sse.addEventListener('error', handleError);

      setEventSource(sse);
      eventSourceRef.current = sse;

      // Store cleanup function
      cleanupRef.current = () => {
        sse.removeEventListener('open', handleOpen);
        sse.removeEventListener('message', handleMessage);
        sse.removeEventListener('error', handleError);
        sse.close();
      };

    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      setConnectionStatus('error');
    }
  }, [session?.user?.email, handleSSEMessage, maxReconnectAttempts, cleanup, connectionStatus]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!isMountedRef.current) return;

    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );

    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!isMountedRef.current) return;

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!isMountedRef.current) return;

    setNotifications(prev => prev.filter(n => n.id !== notificationId));

    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    if (!isMountedRef.current) return;

    setNotifications([]);

    try {
      await fetch('/api/notifications/clear-all', {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  }, []);

  // Reconnect manually
  const reconnect = useCallback(() => {
    if (!isMountedRef.current) return;
    setReconnectAttempts(0);
    reconnectAttemptsRef.current = 0;
    connectSSE();
  }, [connectSSE]);

  // Load existing notifications on mount with performance optimization
  useEffect(() => {
    const loadNotifications = async () => {
      if (!isMountedRef.current) return;
      try {
        const response = await fetch('/api/notifications');
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };

    if (session?.user?.email) {
      // Delay loading notifications slightly to prioritize page load
      setTimeout(loadNotifications, 100);
    }
  }, [session?.user?.email]);

  // Connect to SSE when session is available with delay for better performance
  useEffect(() => {
    if (session?.user?.email) {
      // Delay connection slightly to prioritize page load
      setTimeout(() => {
        if (isMountedRef.current) {
          connectSSE();
        }
      }, 200);
    } else {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
  }, [session?.user?.email, connectSSE]);

  // Auto-reconnect on network recovery with reduced frequency
  useEffect(() => {
    const handleOnline = () => {
      if (session?.user?.email && !isConnected && isMountedRef.current) {
        // Delay reconnection to avoid rapid reconnections
        setTimeout(() => {
          if (isMountedRef.current) {
            reconnect();
          }
        }, 1000);
      }
    };

    const handleOffline = () => {
      if (isMountedRef.current) {
        setIsConnected(false);
        setConnectionStatus('disconnected');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [session?.user?.email, isConnected, reconnect]);

  // Component mount/unmount tracking
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      cleanup();
    };
  }, [cleanup]);

  // Page visibility and unload handling with reduced frequency
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isConnected) {
        // Don't disconnect immediately, wait longer
        setTimeout(() => {
          if (document.hidden && isMountedRef.current) {
            // Only disconnect if still hidden after 2 minutes
            cleanup();
          }
        }, 120000); // 2 minutes
      }
    };

    const handleBeforeUnload = () => {
      cleanup();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanup();
    };
  }, [isConnected, cleanup]);

  const value: SSEContextType = {
    notifications,
    isConnected,
    connectionStatus,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    unreadCount,
    reconnect,
  };

  return (
    <SSEContext.Provider value={value}>
      {children}
    </SSEContext.Provider>
  );
};

export default SSEProvider; 