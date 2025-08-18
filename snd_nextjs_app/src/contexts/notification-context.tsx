'use client';

import { Notification, useNotifications } from '@/hooks/use-notifications';
import React, { createContext, ReactNode, useContext } from 'react';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: (page?: number, perPage?: number, unreadOnly?: boolean) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  showToast: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  showSuccess: (title: string, message: string, actionUrl?: string) => void;
  showError: (title: string, message: string, actionUrl?: string) => void;
  showWarning: (title: string, message: string, actionUrl?: string) => void;
  showInfo: (title: string, message: string, actionUrl?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const notificationUtils = useNotifications();

  return (
    <NotificationContext.Provider value={notificationUtils}>
      {children}
    </NotificationContext.Provider>
  );
};
