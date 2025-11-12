'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotificationContext } from '@/contexts/notification-context';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, ExternalLink } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';

export const NotificationBell: React.FC = () => {
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation('notifications');
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, loading } =
    useNotificationContext();

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    if (notification.action_url) {
      window.location.href = notification.action_url;
    }

    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 max-h-96 overflow-y-auto"
        onCloseAutoFocus={e => e.preventDefault()}
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t('notifications')}</span>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-6 px-2 text-xs"
              >
                {t('markAllRead')}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
            >
              {t('clearAll')}
            </Button>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">{t('loading')}...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">{t('noNotifications')}</div>
        ) : (
          notifications.slice(0, 10).map(notification => (
            <DropdownMenuItem
              key={notification.id}
              className="flex flex-col items-start gap-2 p-3 cursor-pointer hover:bg-gray-50"
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start gap-3 w-full">
                <span className="text-lg">{getNotificationIcon(notification.type)}</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {notification.title}
                    </h4>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getPriorityColor(notification.priority)}`}
                    >
                      {notification.priority}
                    </Badge>
                    {!notification.read && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{notification.message}</p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                    </span>

                    {notification.action_url && <ExternalLink className="h-3 w-3" />}
                  </div>
                </div>

                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}

        {notifications.length > 10 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-center text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
              onClick={() => {
                setIsOpen(false);
                window.location.href = '/${locale}/notifications';
              }}
            >
              {t('viewAllNotifications')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
