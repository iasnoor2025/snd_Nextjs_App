'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/hooks/use-i18n';
import { Activity, AlertCircle, CheckCircle, Clock, FileText, Info, User } from 'lucide-react';

interface ActivityItem {
  id: number;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
  user?: string;
  action?: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

interface RecentActivityProps {
  activities: ActivityItem[];
  onHideSection: () => void;
}

export function RecentActivity({ activities, onHideSection }: RecentActivityProps) {
  const { t } = useI18n();

  // Ensure activities is always an array
  const safeActivities = activities || [];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20';
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20';
      default:
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t('dashboard.recentActivity')}
            </CardTitle>
            <CardDescription>{t('dashboard.recentActivityDescription')}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              {t('dashboard.viewAll')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onHideSection}
              className="flex items-center gap-2"
            >
              {t('dashboard.hideSection')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {safeActivities.length > 0 ? (
          <div className="space-y-3">
            {safeActivities.slice(0, 8).map(activity => (
              <div
                key={activity.id}
                className={`p-3 rounded-lg border ${getActivityColor(activity.type)} transition-colors hover:bg-opacity-80`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {activity.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {activity.user && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {activity.user}
                        </div>
                      )}
                      {activity.action && (
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {activity.action}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">{t('dashboard.noRecentActivity')}</p>
            <p className="text-sm opacity-80">{t('dashboard.noRecentActivityDescription')}</p>
          </div>
        )}

        {/* Activity Summary */}
        {safeActivities.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="font-medium">{t('dashboard.activitySummary')}:</span>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {t('dashboard.success')}: {safeActivities.filter(a => a.type === 'success').length}
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    {t('dashboard.warning')}: {safeActivities.filter(a => a.type === 'warning').length}
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    {t('dashboard.error')}: {safeActivities.filter(a => a.type === 'error').length}
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    {t('dashboard.info')}: {safeActivities.filter(a => a.type === 'info').length}
                  </span>
                </div>
              </div>
              <div className="text-muted-foreground">{t('dashboard.last24Hours')}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
