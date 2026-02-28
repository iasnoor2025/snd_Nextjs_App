'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useI18n } from '@/hooks/use-i18n';
import { RecentActivity as RecentActivityType } from '@/lib/services/dashboard-service';
import { Activity, AlertCircle, Clock, Info, User, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface RecentActivityProps {
  activities: RecentActivityType[];
  onHideSection: () => void;
  currentUser?: string;
  onRefresh?: () => void;
  currentPage?: number;
  totalCount?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

export function RecentActivity({
  activities,
  onHideSection,
  currentUser,
  onRefresh,
  currentPage = 1,
  totalCount = 0,
  pageSize = 5,
  onPageChange,
}: RecentActivityProps) {
  const { t, isRTL } = useI18n();

  // Ensure activities is always an array
  const safeActivities = activities || [];

  const getActivityIcon = (type: string, severity: string) => {
    // For timesheet approvals, show specific icons
    if (type === 'Timesheet Approval') {
      if (type.includes('rejected')) {
        return <XCircle className="h-5 w-5 text-red-500" />;
      }
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }

    // For other activities, use severity-based icons
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getActivityBadgeColor = (type: string, severity: string) => {
    if (type === 'Timesheet Approval') {
      return 'bg-green-100 text-green-800 border-green-200';
    }

    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'N/A';

    try {
      // Parse the timestamp and ensure it's treated as UTC if it doesn't have timezone info
      const date = new Date(timestamp);
      const now = new Date();

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid timestamp:', timestamp);
        return 'Invalid date';
      }



      const diffInMs = now.getTime() - date.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInMinutes < 1) {
        return t('dashboard.justNow');
      } else if (diffInMinutes < 60) {
        return t('dashboard.minutesAgo', { minutes: String(diffInMinutes) });
      } else if (diffInHours < 24) {
        return t('dashboard.hoursAgo', { hours: String(diffInHours) });
      } else if (diffInDays < 7) {
        return t('dashboard.daysAgo', { days: String(diffInDays) });
      } else {
        // Show full date and time for older entries with Saudi Arabia timezone
        return date.toLocaleString(isRTL ? 'ar-SA' : 'en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Riyadh' // Saudi Arabia timezone
        });
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Invalid date';
    }
  };

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'Timesheet Approval':
        return 'Approval';
      case 'Timesheet Submission':
        return 'Submission';
      case 'Leave Request':
        return 'Leave';
      case 'Equipment Assignment':
        return 'Equipment';
      case 'Project Assignment':
        return 'Project';
      case 'Document Update':
        return 'Document';
      case 'Rental Activity':
        return 'Rental';
      default:
        return type;
    }
  };

  const renderChanges = (changes: any) => {
    if (!changes || !changes.before || !changes.after) return null;

    const before = changes.before;
    const after = changes.after;
    const modifiedFields = Object.keys(after).filter(key =>
      JSON.stringify(before[key]) !== JSON.stringify(after[key]) &&
      key !== 'updatedAt' && key !== 'updated_at'
    );

    if (modifiedFields.length === 0) return null;

    return (
      <span className="text-xs text-muted-foreground">
        <span className="font-medium text-gray-700 dark:text-gray-300">Changes: </span>
        {modifiedFields.map((field, i) => {
          const label = field.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
          return (
            <span key={field}>
              {i > 0 && <span className="text-gray-400 mx-1">·</span>}
              <span className="capitalize">{label}: </span>
              <span className="text-red-600 dark:text-red-400 line-through">{String(before[field] ?? 'None')}</span>
              <span className="text-gray-400">→</span>
              <span className="text-green-600 dark:text-green-400">{String(after[field] ?? 'None')}</span>
            </span>
          );
        })}
      </span>
    );
  };

  return (
    <Card className="w-full">
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
            <Button variant="outline" size="sm" onClick={onRefresh}>
              {t('dashboard.refresh') || 'Refresh'}
            </Button>
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
      <CardContent>
        {safeActivities.length > 0 ? (
          <div className="space-y-2">
            {safeActivities.map((activity, index) => (
              <div key={activity.id} className="relative">
                {/* Timeline connector */}
                {index < safeActivities.length - 1 && (
                  <div className="absolute left-5 top-6 w-0.5 h-4 bg-gray-200 dark:bg-gray-700" />
                )}

                <div className="flex items-center gap-3 py-1">
                  {/* Icon */}
                  <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center [&_svg]:h-4 [&_svg]:w-4">
                    {getActivityIcon(activity.type, activity.severity)}
                  </div>

                  {/* Content - compact single line */}
                  <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium shrink-0 ${getActivityBadgeColor(activity.type, activity.severity)}`}
                    >
                      {getActivityTypeLabel(activity.type)}
                    </Badge>
                    <span className="text-muted-foreground shrink-0">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {activity.description || 'No description'}
                    </span>
                    {activity.changes && renderChanges(activity.changes)}
                    {activity.user && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <User className="h-3 w-3" />
                        {activity.user}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="font-medium text-lg">{t('dashboard.noRecentActivity')}</p>
            <p className="text-sm opacity-80">{t('dashboard.noRecentActivityDescription')}</p>
          </div>
        )}

        {/* Pagination */}
        {safeActivities.length > 0 && totalCount > pageSize && onPageChange && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {t('common.pagination.showing')} {(currentPage - 1) * pageSize + 1}{' '}
              {t('common.pagination.to')} {Math.min(currentPage * pageSize, totalCount)}{' '}
              {t('common.pagination.of')} {totalCount} {t('common.pagination.results')}
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                    className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {(() => {
                  const totalPages = Math.ceil(totalCount / pageSize);
                  const pageNumbers: number[] = [];
                  for (let p = 1; p <= totalPages; p++) {
                    if (p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1) {
                      pageNumbers.push(p);
                    }
                  }
                  const deduped = [...new Set(pageNumbers)].sort((a, b) => a - b);
                  const items: JSX.Element[] = [];
                  let prev = 0;
                  for (const p of deduped) {
                    if (prev && p > prev + 1) {
                      items.push(
                        <PaginationItem key={`ellipsis-${p}`}>
                          <span className="px-2 text-muted-foreground">…</span>
                        </PaginationItem>
                      );
                    }
                    items.push(
                      <PaginationItem key={p}>
                        <PaginationLink
                          onClick={() => onPageChange(p)}
                          isActive={currentPage === p}
                          className="cursor-pointer"
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    );
                    prev = p;
                  }
                  return items;
                })()}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      currentPage < Math.ceil(totalCount / pageSize) && onPageChange(currentPage + 1)
                    }
                    className={
                      currentPage >= Math.ceil(totalCount / pageSize)
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Activity Summary */}
        {safeActivities.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {t('dashboard.activitySummary')}
                </h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-muted-foreground">
                      High: {safeActivities.filter(a => a.severity === 'high').length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-muted-foreground">
                      Medium: {safeActivities.filter(a => a.severity === 'medium').length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-muted-foreground">
                      Low: {safeActivities.filter(a => a.severity === 'low').length}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {t('dashboard.last24Hours')}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
