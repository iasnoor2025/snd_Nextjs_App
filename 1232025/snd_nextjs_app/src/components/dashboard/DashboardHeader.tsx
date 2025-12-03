'use client';


import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/use-i18n';
import {
  AlertTriangle,
  Building2,
  Calendar,
  FileText,
  RefreshCw,
  TrendingUp,
  Truck,
  Users,
  Wrench,
  Target,
} from 'lucide-react';

// Helper function to format large numbers
const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

interface DashboardHeaderProps {
  stats: any;
  refreshing: boolean;
  onRefresh: () => void;
  session: any;
  accessibleSections?: string[];
  loading?: boolean;
}

export function DashboardHeader({
  stats,
  refreshing,
  onRefresh,
  session,
  accessibleSections = [],
  loading = false,
}: DashboardHeaderProps) {
  const { t } = useI18n();

  return (
    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white shadow-lg">
      <div className="px-6 py-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{t('dashboard.title')}</h1>
            <p className="text-blue-100 text-lg">
              {t('dashboard.welcome_back', { name: session?.user?.name || t('dashboard.user') })}{' '}
              {t('dashboard.monitor_business_performance')}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="text-sm text-blue-100">
                {t('dashboard.auto_refresh')}:{' '}
                <span className="font-medium">{t('dashboard.enabled')}</span>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>

            <Button
              onClick={onRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="bg-white/50 hover:bg-white/80 dark:bg-slate-800/50 dark:hover:bg-slate-800/80"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? t('dashboard.refreshing') : t('dashboard.refresh')}
            </Button>
          </div>
        </div>

        {/* Quick Stats Overview */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-11 gap-4">
            {/* Total Employees - Employee Management */}
            {(accessibleSections.includes('myTeam') || accessibleSections.length === 0 || !accessibleSections) && (
              <div className="text-center p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                <Users className="h-6 w-6 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">
                  {loading ? (
                    <div className="animate-pulse bg-white/20 h-8 w-16 mx-auto rounded"></div>
                  ) : (
                    formatNumber(stats?.totalEmployees || 0)
                  )}
                </div>
                <div className="text-xs text-blue-100">{t('dashboard.totalEmployees')}</div>
              </div>
            )}
            
            {/* Active Projects - Project Management */}
            {(accessibleSections.includes('projectOverview') || accessibleSections.length === 0 || !accessibleSections) && (
              <div className="text-center p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                <Calendar className="h-6 w-6 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">
                  {loading ? (
                    <div className="animate-pulse bg-white/20 h-8 w-16 mx-auto rounded"></div>
                  ) : (
                    formatNumber(stats?.activeProjects || 0)
                  )}
                </div>
                <div className="text-xs text-blue-100">{t('dashboard.activeProjects')}</div>
              </div>
            )}
            
            {/* Total Projects - Project Management */}
            {(accessibleSections.includes('projectOverview') || accessibleSections.length === 0 || !accessibleSections) && (
              <div className="text-center p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                <Target className="h-6 w-6 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">
                  {loading ? (
                    <div className="animate-pulse bg-white/20 h-8 w-16 mx-auto rounded"></div>
                  ) : (
                    formatNumber(stats?.totalProjects || 0)
                  )}
                </div>
                <div className="text-xs text-blue-100">{t('dashboard.totalProjects')}</div>
              </div>
            )}
            
            {/* Money Received - Financial */}
            {(accessibleSections.includes('financial') || accessibleSections.length === 0 || !accessibleSections) && (
              <div className="text-center p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">
                  {loading ? (
                    <div className="animate-pulse bg-white/20 h-8 w-20 mx-auto rounded"></div>
                  ) : (
                    formatNumber(stats?.monthlyMoneyReceived || 0)
                  )}
                </div>
                <div className="text-xs text-blue-100">{t('dashboard.moneyReceived')}</div>
              </div>
            )}
            
            {/* Money Lost - Financial */}
            {(accessibleSections.includes('financial') || accessibleSections.length === 0 || !accessibleSections) && (
              <div className="text-center p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                <TrendingUp
                  className="h-6 w-6 mx-auto mb-2 opacity-80"
                  style={{ transform: 'rotate(180deg)' }}
                />
                <div className="text-2xl font-bold">
                  {loading ? (
                    <div className="animate-pulse bg-white/20 h-8 w-20 mx-auto rounded"></div>
                  ) : (
                    formatNumber(stats?.monthlyMoneyLost || 0)
                  )}
                </div>
                <div className="text-xs text-blue-100">{t('dashboard.moneyLost')}</div>
              </div>
            )}
            
            {/* Pending Approvals - Today's Attendance */}
            {(accessibleSections.includes('timesheets') || accessibleSections.length === 0 || !accessibleSections) && (
              <div className="text-center p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">
                  {loading ? (
                    <div className="animate-pulse bg-white/20 h-8 w-16 mx-auto rounded"></div>
                  ) : (
                    formatNumber(stats?.pendingApprovals || 0)
                  )}
                </div>
                <div className="text-xs text-blue-100">{t('dashboard.pendingApprovals')}</div>
              </div>
            )}
            
            {/* Total Companies - Company Management */}
            {(accessibleSections.includes('manualAssignments') || accessibleSections.length === 0 || !accessibleSections) && (
              <div className="text-center p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                <Building2 className="h-6 w-6 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">
                  {loading ? (
                    <div className="animate-pulse bg-white/20 h-8 w-16 mx-auto rounded"></div>
                  ) : (
                    formatNumber(stats?.totalCompanies || 0)
                  )}
                </div>
                <div className="text-xs text-blue-100">{t('dashboard.totalCompanies')}</div>
              </div>
            )}
            
            {/* Total Equipment - Equipment Management */}
            {(accessibleSections.includes('equipment') || accessibleSections.length === 0 || !accessibleSections) && (
              <div className="text-center p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                <Wrench className="h-6 w-6 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">
                  {loading ? (
                    <div className="animate-pulse bg-white/20 h-8 w-16 mx-auto rounded"></div>
                  ) : (
                    formatNumber(stats?.totalEquipment || 0)
                  )}
                </div>
                <div className="text-xs text-blue-100">{t('dashboard.totalEquipment')}</div>
              </div>
            )}
            
            {/* Active Rentals - Rental Management */}
            {(accessibleSections.includes('quickActions') || accessibleSections.length === 0 || !accessibleSections) && (
              <div className="text-center p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                <Truck className="h-6 w-6 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">
                  {loading ? (
                    <div className="animate-pulse bg-white/20 h-8 w-16 mx-auto rounded"></div>
                  ) : (
                    formatNumber(stats?.activeRentals || 0)
                  )}
                </div>
                <div className="text-xs text-blue-100">{t('dashboard.activeRentals')}</div>
              </div>
            )}
            
            {/* Total Rentals - Rental Management */}
            {(accessibleSections.includes('quickActions') || accessibleSections.length === 0 || !accessibleSections) && (
              <div className="text-center p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                <Truck className="h-6 w-6 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">
                  {loading ? (
                    <div className="animate-pulse bg-white/20 h-8 w-16 mx-auto rounded"></div>
                  ) : (
                    formatNumber(stats?.totalRentals || 0)
                  )}
                </div>
                <div className="text-xs text-blue-100">{t('dashboard.totalRentals')}</div>
              </div>
            )}
            
            {/* Total Documents - Document Management */}
            {(accessibleSections.includes('recentActivity') || accessibleSections.length === 0 || !accessibleSections) && (
              <div className="text-center p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                <FileText className="h-6 w-6 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">
                  {loading ? (
                    <div className="animate-pulse bg-white/20 h-8 w-16 mx-auto rounded"></div>
                  ) : (
                    formatNumber(stats?.totalDocuments || 0)
                  )}
                </div>
                <div className="text-xs text-blue-100">{t('dashboard.totalDocuments')}</div>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
