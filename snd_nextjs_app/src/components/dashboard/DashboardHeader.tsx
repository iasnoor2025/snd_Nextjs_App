'use client';


import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/use-i18n';
import { useState, useEffect } from 'react';
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
  const [roleColor, setRoleColor] = useState<string | null>(null);
  const currentUserRole = (session?.user?.role as string) || 'USER';

  // Map color name to dashboard gradient classes
  const getDashboardGradient = (colorName: string | null | undefined) => {
    if (!colorName) {
      return 'bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800'; // Default blue
    }

    const gradientMap: Record<string, string> = {
      'red': 'bg-gradient-to-r from-red-600 via-red-700 to-red-800',
      'blue': 'bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800',
      'purple': 'bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800',
      'orange': 'bg-gradient-to-r from-orange-600 via-orange-700 to-orange-800',
      'green': 'bg-gradient-to-r from-green-600 via-green-700 to-green-800',
      'gray': 'bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800',
      'slate': 'bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800',
      'indigo': 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800',
      'teal': 'bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800',
      'pink': 'bg-gradient-to-r from-pink-600 via-pink-700 to-pink-800',
      'cyan': 'bg-gradient-to-r from-cyan-600 via-cyan-700 to-cyan-800',
      'amber': 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800',
      'emerald': 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800',
      'violet': 'bg-gradient-to-r from-violet-600 via-violet-700 to-violet-800',
      'rose': 'bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800',
    };

    const normalizedColor = colorName.toLowerCase();
    return gradientMap[normalizedColor] || 'bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800';
  };

  // Get text color classes based on role color (for better contrast)
  const getTextColorClasses = (colorName: string | null | undefined) => {
    if (!colorName) {
      return 'text-white text-blue-100'; // Default
    }

    const normalizedColor = colorName.toLowerCase();
    // For darker colors, use white text; for lighter colors, use darker text
    const lightColors = ['amber', 'cyan', 'teal', 'emerald'];
    if (lightColors.includes(normalizedColor)) {
      return 'text-white text-slate-100';
    }
    return 'text-white';
  };

  // Get dashboard gradient based on role (with database color support)
  const getDashboardGradientByRole = (role: string, roleColor?: string | null) => {
    // First, try to use color from database
    if (roleColor) {
      const dbGradient = getDashboardGradient(roleColor);
      if (dbGradient) return dbGradient;
    }
    
    // Fallback to hardcoded colors for known roles
    const roleUpper = role.toUpperCase();
    const roleGradients: Record<string, string> = {
      'SUPER_ADMIN': 'bg-gradient-to-r from-red-600 via-red-700 to-red-800',
      'ADMIN': 'bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800',
      'MANAGER': 'bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800',
      'SUPERVISOR': 'bg-gradient-to-r from-orange-600 via-orange-700 to-orange-800',
      'OPERATOR': 'bg-gradient-to-r from-green-600 via-green-700 to-green-800',
      'EMPLOYEE': 'bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800',
      'USER': 'bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800',
    };

    if (roleGradients[roleUpper]) {
      return roleGradients[roleUpper];
    }

    // For custom roles without color, use hash-based auto-assignment
    const roleHash = role.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorOptions = [
      'bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800',
      'bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800',
      'bg-gradient-to-r from-pink-600 via-pink-700 to-pink-800',
      'bg-gradient-to-r from-cyan-600 via-cyan-700 to-cyan-800',
      'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800',
      'bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800',
      'bg-gradient-to-r from-violet-600 via-violet-700 to-violet-800',
      'bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800',
    ];
    
    return colorOptions[roleHash % colorOptions.length];
  };

  // Fetch role color from database
  useEffect(() => {
    const fetchRoleColor = async () => {
      if (!session?.user?.role) {
        return;
      }

      try {
        const rolesResponse = await fetch('/api/roles');
        if (rolesResponse.ok) {
          const roles = await rolesResponse.json();
          const role = roles.find((r: { name: string }) => 
            r.name.toUpperCase() === (session.user.role as string).toUpperCase()
          );
          if (role?.color) {
            setRoleColor(role.color);
          }
        }
      } catch (error) {
        console.error('Error fetching role color:', error);
      }
    };

    fetchRoleColor();
  }, [session?.user?.role]);

  const gradientClass = getDashboardGradientByRole(currentUserRole, roleColor);
  const textColorClass = getTextColorClasses(roleColor);

  return (
    <div className={`${gradientClass} text-white shadow-lg transition-colors duration-300`}>
      <div className="px-6 py-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{t('dashboard.title')}</h1>
            <p className={`${textColorClass.includes('slate') ? 'text-slate-100' : 'text-blue-100'} text-lg`}>
              {t('dashboard.welcome_back', { name: session?.user?.name || t('dashboard.user') })}{' '}
              {t('dashboard.monitor_business_performance')}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`text-sm ${textColorClass.includes('slate') ? 'text-slate-100' : 'text-blue-100'}`}>
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
              <div className="text-center p-3 rounded-lg bg-white/10 dark:bg-white/5 backdrop-blur-sm hover:bg-white/20 transition-colors">
                <Users className="h-6 w-6 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">
                  {loading ? (
                    <div className="animate-pulse bg-white/20 h-8 w-16 mx-auto rounded"></div>
                  ) : (
                    formatNumber(stats?.totalEmployees || 0)
                  )}
                </div>
                <div className={`text-xs ${textColorClass.includes('slate') ? 'text-slate-100' : 'text-blue-100'}`}>{t('dashboard.totalEmployees')}</div>
              </div>
            )}
            
            {/* Active Projects - Project Management */}
            {(accessibleSections.includes('projectOverview') || accessibleSections.length === 0 || !accessibleSections) && (
              <div className="text-center p-3 rounded-lg bg-white/10 dark:bg-white/5 backdrop-blur-sm hover:bg-white/20 transition-colors">
                <Calendar className="h-6 w-6 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">
                  {loading ? (
                    <div className="animate-pulse bg-white/20 h-8 w-16 mx-auto rounded"></div>
                  ) : (
                    formatNumber(stats?.activeProjects || 0)
                  )}
                </div>
                <div className={`text-xs ${textColorClass.includes('slate') ? 'text-slate-100' : 'text-blue-100'}`}>{t('dashboard.activeProjects')}</div>
              </div>
            )}
            
            {/* Total Projects - Project Management */}
            {(accessibleSections.includes('projectOverview') || accessibleSections.length === 0 || !accessibleSections) && (
              <div className="text-center p-3 rounded-lg bg-white/10 dark:bg-white/5 backdrop-blur-sm hover:bg-white/20 transition-colors">
                <Target className="h-6 w-6 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">
                  {loading ? (
                    <div className="animate-pulse bg-white/20 h-8 w-16 mx-auto rounded"></div>
                  ) : (
                    formatNumber(stats?.totalProjects || 0)
                  )}
                </div>
                <div className={`text-xs ${textColorClass.includes('slate') ? 'text-slate-100' : 'text-blue-100'}`}>{t('dashboard.totalProjects')}</div>
              </div>
            )}
            
            {/* Money Received - Financial */}
            {(accessibleSections.includes('financial') || accessibleSections.length === 0 || !accessibleSections) && (
              <div className="text-center p-3 rounded-lg bg-white/10 dark:bg-white/5 backdrop-blur-sm hover:bg-white/20 transition-colors">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">
                  {loading ? (
                    <div className="animate-pulse bg-white/20 h-8 w-20 mx-auto rounded"></div>
                  ) : (
                    formatNumber(stats?.monthlyMoneyReceived || 0)
                  )}
                </div>
                <div className={`text-xs ${textColorClass.includes('slate') ? 'text-slate-100' : 'text-blue-100'}`}>{t('dashboard.moneyReceived')}</div>
              </div>
            )}
            
            {/* Money Lost - Financial */}
            {(accessibleSections.includes('financial') || accessibleSections.length === 0 || !accessibleSections) && (
              <div className="text-center p-3 rounded-lg bg-white/10 dark:bg-white/5 backdrop-blur-sm hover:bg-white/20 transition-colors">
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
                <div className={`text-xs ${textColorClass.includes('slate') ? 'text-slate-100' : 'text-blue-100'}`}>{t('dashboard.moneyLost')}</div>
              </div>
            )}
            
            {/* Pending Approvals - Today's Attendance */}
            {(accessibleSections.includes('timesheets') || accessibleSections.length === 0 || !accessibleSections) && (
              <div className="text-center p-3 rounded-lg bg-white/10 dark:bg-white/5 backdrop-blur-sm hover:bg-white/20 transition-colors">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">
                  {loading ? (
                    <div className="animate-pulse bg-white/20 h-8 w-16 mx-auto rounded"></div>
                  ) : (
                    formatNumber(stats?.pendingApprovals || 0)
                  )}
                </div>
                <div className={`text-xs ${textColorClass.includes('slate') ? 'text-slate-100' : 'text-blue-100'}`}>{t('dashboard.pendingApprovals')}</div>
              </div>
            )}
            
            {/* Total Companies - Company Management */}
            {(accessibleSections.includes('manualAssignments') || accessibleSections.length === 0 || !accessibleSections) && (
              <div className="text-center p-3 rounded-lg bg-white/10 dark:bg-white/5 backdrop-blur-sm hover:bg-white/20 transition-colors">
                <Building2 className="h-6 w-6 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">
                  {loading ? (
                    <div className="animate-pulse bg-white/20 h-8 w-16 mx-auto rounded"></div>
                  ) : (
                    formatNumber(stats?.totalCompanies || 0)
                  )}
                </div>
                <div className={`text-xs ${textColorClass.includes('slate') ? 'text-slate-100' : 'text-blue-100'}`}>{t('dashboard.totalCompanies')}</div>
              </div>
            )}
            
            {/* Total Equipment - Equipment Management */}
            {(accessibleSections.includes('equipment') || accessibleSections.length === 0 || !accessibleSections) && (
              <div className="text-center p-3 rounded-lg bg-white/10 dark:bg-white/5 backdrop-blur-sm hover:bg-white/20 transition-colors">
                <Wrench className="h-6 w-6 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">
                  {loading ? (
                    <div className="animate-pulse bg-white/20 h-8 w-16 mx-auto rounded"></div>
                  ) : (
                    formatNumber(stats?.totalEquipment || 0)
                  )}
                </div>
                <div className={`text-xs ${textColorClass.includes('slate') ? 'text-slate-100' : 'text-blue-100'}`}>{t('dashboard.totalEquipment')}</div>
              </div>
            )}
            
            {/* Active Rentals - Rental Management */}
            {(accessibleSections.includes('quickActions') || accessibleSections.length === 0 || !accessibleSections) && (
              <div className="text-center p-3 rounded-lg bg-white/10 dark:bg-white/5 backdrop-blur-sm hover:bg-white/20 transition-colors">
                <Truck className="h-6 w-6 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">
                  {loading ? (
                    <div className="animate-pulse bg-white/20 h-8 w-16 mx-auto rounded"></div>
                  ) : (
                    formatNumber(stats?.activeRentals || 0)
                  )}
                </div>
                <div className={`text-xs ${textColorClass.includes('slate') ? 'text-slate-100' : 'text-blue-100'}`}>{t('dashboard.activeRentals')}</div>
              </div>
            )}
            
            {/* Total Rentals - Rental Management */}
            {(accessibleSections.includes('quickActions') || accessibleSections.length === 0 || !accessibleSections) && (
              <div className="text-center p-3 rounded-lg bg-white/10 dark:bg-white/5 backdrop-blur-sm hover:bg-white/20 transition-colors">
                <Truck className="h-6 w-6 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">
                  {loading ? (
                    <div className="animate-pulse bg-white/20 h-8 w-16 mx-auto rounded"></div>
                  ) : (
                    formatNumber(stats?.totalRentals || 0)
                  )}
                </div>
                <div className={`text-xs ${textColorClass.includes('slate') ? 'text-slate-100' : 'text-blue-100'}`}>{t('dashboard.totalRentals')}</div>
              </div>
            )}
            
            {/* Total Documents - Document Management */}
            {(accessibleSections.includes('recentActivity') || accessibleSections.length === 0 || !accessibleSections) && (
              <div className="text-center p-3 rounded-lg bg-white/10 dark:bg-white/5 backdrop-blur-sm hover:bg-white/20 transition-colors">
                <FileText className="h-6 w-6 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">
                  {loading ? (
                    <div className="animate-pulse bg-white/20 h-8 w-16 mx-auto rounded"></div>
                  ) : (
                    formatNumber(stats?.totalDocuments || 0)
                  )}
                </div>
                <div className={`text-xs ${textColorClass.includes('slate') ? 'text-slate-100' : 'text-blue-100'}`}>{t('dashboard.totalDocuments')}</div>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
