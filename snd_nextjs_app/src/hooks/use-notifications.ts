import ApiService from '@/lib/api-service';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: Record<string, any>;
  timestamp: Date;
  read: boolean;
  action_url?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface NotificationResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
    };
  };
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (page = 1, perPage = 50, unreadOnly = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await ApiService.getNotifications({
        page,
        per_page: perPage,
        unread_only: unreadOnly,
      });

      if (response.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.notifications.filter((n: Notification) => !n.read).length);
      }
    } catch (err) {
      setError('Failed to fetch notifications');
      
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await ApiService.markNotificationAsRead(notificationId);

      setNotifications(prev => prev.map(n => (n.id === notificationId ? { ...n, read: true } : n)));

      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await ApiService.markAllNotificationsAsRead();

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));

      setUnreadCount(0);
    } catch (err) {
      
    }
  }, []);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    try {
      await ApiService.clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      
    }
  }, []);

  // Show toast notification
  const showToast = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const toastOptions = {
      description: notification.message,
      action: notification.action_url
        ? {
            label: 'View',
            onClick: () => {
              if (typeof window !== 'undefined') {
                window.location.href = notification.action_url!;
              }
            },
          }
        : undefined,
    };

    switch (notification.type) {
      case 'success':
        toast.success(notification.title, toastOptions);
        break;
      case 'error':
        toast.error(notification.title, toastOptions);
        break;
      case 'warning':
        toast.warning(notification.title, toastOptions);
        break;
      case 'info':
      default:
        toast.info(notification.title, toastOptions);
        break;
    }
  }, []);

  // Show success toast
  const showSuccess = useCallback(
    (title: string, message: string, actionUrl?: string) => {
      showToast({
        type: 'success',
        title,
        message,
        action_url: actionUrl || '',
        priority: 'medium',
      });
    },
    [showToast]
  );

  // Show error toast
  const showError = useCallback(
    (title: string, message: string, actionUrl?: string) => {
      showToast({
        type: 'error',
        title,
        message,
        action_url: actionUrl || '',
        priority: 'high',
      });
    },
    [showToast]
  );

  // Show warning toast
  const showWarning = useCallback(
    (title: string, message: string, actionUrl?: string) => {
      showToast({
        type: 'warning',
        title,
        message,
        action_url: actionUrl || '',
        priority: 'medium',
      });
    },
    [showToast]
  );

  // Show info toast
  const showInfo = useCallback(
    (title: string, message: string, actionUrl?: string) => {
      showToast({
        type: 'info',
        title,
        message,
        action_url: actionUrl || '',
        priority: 'low',
      });
    },
    [showToast]
  );

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearAll,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
