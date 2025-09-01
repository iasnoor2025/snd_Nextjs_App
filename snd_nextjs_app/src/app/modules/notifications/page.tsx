
'use client';


// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/protected-route';
import { NotificationDemo } from '@/components/notification-demo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotificationContext } from '@/contexts/notification-context';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NotificationsPage() {
  const { t } = useTranslation('notifications');
  const { user, hasPermission, getAllowedActions } = useRBAC();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, loading } =
    useNotificationContext();

  // Get allowed actions for notifications
  const allowedActions = getAllowedActions('Notification');

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
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
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
                <p className="text-gray-600">{t('description')}</p>
              </div>
              {hasPermission('create', 'Notification') && (
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  {t('newNotification')}
                </Button>
              )}
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="h-6 w-6 text-blue-600" />
                  <div>
                    <CardTitle>{t('notificationsTitle')}</CardTitle>
                    <CardDescription>{t('notificationsDescription')}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={markAllAsRead}
                      className="flex items-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      {t('markAllRead')}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAll}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('clearAll')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">{t('loading')}...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noNotifications')}</h3>
                  <p className="text-gray-600">{t('noNotificationsDescription')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                      } hover:bg-gray-100`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{getNotificationIcon(notification.type)}</span>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </h4>
                            <Badge
                              variant="secondary"
                              className={`text-xs ${getPriorityColor(notification.priority)}`}
                            >
                              {notification.priority}
                            </Badge>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full" />
                            )}
                          </div>

                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>
                              {formatDistanceToNow(new Date(notification.timestamp), {
                                addSuffix: true,
                              })}
                            </span>

                            {notification.action_url && (
                              <div className="flex items-center gap-1 text-blue-600">
                                <ExternalLink className="h-3 w-3" />
                                <span>Click to view</span>
                              </div>
                            )}
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
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notification Demo */}
          <NotificationDemo />
        </div>
      </div>
    </ProtectedRoute>
  );
}
