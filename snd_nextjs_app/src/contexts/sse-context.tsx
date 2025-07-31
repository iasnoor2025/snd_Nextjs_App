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
  const [maxReconnectAttempts] = useState(5);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Handle SSE messages
  const handleSSEMessage = useCallback((data: any) => {
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

    }
  }, []);

  // Handle notification messages
  const handleNotification = useCallback((payload: any) => {
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

    // Show toast notification
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
  }, []);

  // Handle system messages
  const handleSystemMessage = useCallback((payload: any) => {
    
    
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

    }
  }, []);

  // Handle update messages
  const handleUpdate = useCallback((payload: any) => {
    
    
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

    }
  }, []);

  // Initialize SSE connection
  const connectSSE = useCallback(() => {
    if (!session?.user?.email) {
      setConnectionStatus('disconnected');
      return;
    }

    try {
      setConnectionStatus('connecting');
      
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Create new EventSource connection
      const sse = new EventSource('/api/sse', {
        withCredentials: true,
      });

      sse.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        setReconnectAttempts(0);
        reconnectAttemptsRef.current = 0;

      };

      sse.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleSSEMessage(data);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      sse.onerror = (error) => {
        console.error('SSE connection error:', error);
        setIsConnected(false);
        setConnectionStatus('error');
        
        // Attempt to reconnect using a ref to avoid dependency issues
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          setTimeout(() => {
            connectSSE();
          }, Math.pow(2, reconnectAttemptsRef.current) * 1000); // Exponential backoff
          reconnectAttemptsRef.current += 1;
          setReconnectAttempts(reconnectAttemptsRef.current);
        }
      };

      setEventSource(sse);
      eventSourceRef.current = sse;
    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      setConnectionStatus('error');
    }
  }, [session?.user?.email, handleSSEMessage, maxReconnectAttempts]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
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
    setReconnectAttempts(0);
    reconnectAttemptsRef.current = 0;
    connectSSE();
  }, [connectSSE]);

  // Load existing notifications on mount
  useEffect(() => {
    const loadNotifications = async () => {
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
      loadNotifications();
    }
  }, [session?.user?.email]);

  // Connect to SSE when session is available
  useEffect(() => {
    if (session?.user?.email) {
      connectSSE();
    } else {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [session?.user?.email, connectSSE]);

  // Auto-reconnect on network recovery
  useEffect(() => {
    const handleOnline = () => {
      if (session?.user?.email && !isConnected) {

        reconnect();
      }
    };

    const handleOffline = () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [session?.user?.email, isConnected, reconnect]);

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