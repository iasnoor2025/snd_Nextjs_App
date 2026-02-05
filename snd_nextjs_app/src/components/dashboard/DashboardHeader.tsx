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
  const [userPreferredColor, setUserPreferredColor] = useState<string | null>(null);
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

  // Get dashboard gradient based on role (with database color support and user preference)
  const getDashboardGradientByRole = (role: string, roleColor?: string | null, userPreferredColor?: string | null) => {
    // First, check if user has a preferred color (highest priority)
    if (userPreferredColor) {
      const userGradient = getDashboardGradient(userPreferredColor);
      if (userGradient) return userGradient;
    }

    // Second, try to use color from database (role color)
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

  // Fetch role color and user preferred color from database
  useEffect(() => {
    const fetchColorInfo = async () => {
      if (!session?.user?.role) {
        return;
      }

      try {
        // Fetch user info to get preferred color
        const userResponse = await fetch('/api/auth/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.user?.preferredColor) {
            setUserPreferredColor(userData.user.preferredColor);
          }
        }

        // Fetch role color
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
        console.error('Error fetching color info:', error);
      }
    };

    fetchColorInfo();
  }, [session?.user?.role]);

  const gradientClass = getDashboardGradientByRole(currentUserRole, roleColor, userPreferredColor);
  const textColorClass = getTextColorClasses(userPreferredColor || roleColor);

  return (
    <div className={`${gradientClass} text-white shadow-xl transition-colors duration-300 relative overflow-hidden`}>
      {/* Abstract background blobs for premium feel */}
      <div className="absolute top-[-10%] left-[-5%] w-[30rem] h-[30rem] bg-white/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[20rem] h-[20rem] bg-black/10 rounded-full blur-3xl animate-pulse" />

      <div className="px-6 py-8 relative z-10 animate-fade-in">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex-1 space-y-1 animate-slide-in" style={{ animationDelay: '100ms' }}>
            <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-sm">
              {t('dashboard.title')}
            </h1>
            <p className={`${textColorClass.includes('slate') ? 'text-slate-100' : 'text-blue-100'} text-lg opacity-90`}>
              {t('dashboard.welcome_back', { name: session?.user?.name || t('dashboard.user') })}{' '}
              {t('dashboard.monitor_business_performance')}
            </p>
          </div>

          <div className="flex items-center gap-4 animate-slide-in" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
              <div className={`text-xs ${textColorClass.includes('slate') ? 'text-slate-200' : 'text-blue-100'}`}>
                {t('dashboard.auto_refresh')}:{' '}
                <span className="font-semibold text-white">{t('dashboard.enabled')}</span>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]"></div>
            </div>

            <Button
              onClick={onRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="bg-white/20 hover:bg-white/30 border-white/20 backdrop-blur-md text-white transition-all hover:scale-105"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? t('dashboard.refreshing') : t('dashboard.refresh')}
            </Button>
          </div>
        </div>

        {/* Quick Stats Overview */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-11 gap-4">
          {/* Total Employees */}
          {(accessibleSections.includes('myTeam') || !accessibleSections.length) && (
            <div className="text-center p-3 rounded-xl bg-white/15 border border-white/10 backdrop-blur-lg hover:bg-white/25 transition-all duration-300 hover:-translate-y-1 group animate-slide-in" style={{ animationDelay: '300ms' }}>
              <Users className="h-5 w-5 mx-auto mb-2 opacity-70 group-hover:opacity-100 transition-opacity" />
              <div className="text-2xl font-bold tracking-tight">
                {loading ? (
                  <div className="animate-pulse bg-white/20 h-8 w-12 mx-auto rounded"></div>
                ) : (
                  formatNumber(stats?.totalEmployees || 0)
                )}
              </div>
              <div className={`text-[10px] uppercase tracking-wider font-semibold ${textColorClass.includes('slate') ? 'text-slate-200' : 'text-blue-100'}`}>{t('dashboard.totalEmployees')}</div>
            </div>
          )}

          {/* Active Projects */}
          {(accessibleSections.includes('projectOverview') || !accessibleSections.length) && (
            <div className="text-center p-3 rounded-xl bg-white/15 border border-white/10 backdrop-blur-lg hover:bg-white/25 transition-all duration-300 hover:-translate-y-1 group animate-slide-in" style={{ animationDelay: '350ms' }}>
              <Calendar className="h-5 w-5 mx-auto mb-2 opacity-70 group-hover:opacity-100 transition-opacity" />
              <div className="text-2xl font-bold tracking-tight">
                {loading ? (
                  <div className="animate-pulse bg-white/20 h-8 w-12 mx-auto rounded"></div>
                ) : (
                  formatNumber(stats?.activeProjects || 0)
                )}
              </div>
              <div className={`text-[10px] uppercase tracking-wider font-semibold ${textColorClass.includes('slate') ? 'text-slate-200' : 'text-blue-100'}`}>{t('dashboard.activeProjects')}</div>
            </div>
          )}

          {/* Total Projects */}
          {(accessibleSections.includes('projectOverview') || !accessibleSections.length) && (
            <div className="text-center p-3 rounded-xl bg-white/15 border border-white/10 backdrop-blur-lg hover:bg-white/25 transition-all duration-300 hover:-translate-y-1 group animate-slide-in" style={{ animationDelay: '400ms' }}>
              <Target className="h-5 w-5 mx-auto mb-2 opacity-70 group-hover:opacity-100 transition-opacity" />
              <div className="text-2xl font-bold tracking-tight">
                {loading ? (
                  <div className="animate-pulse bg-white/20 h-8 w-12 mx-auto rounded"></div>
                ) : (
                  formatNumber(stats?.totalProjects || 0)
                )}
              </div>
              <div className={`text-[10px] uppercase tracking-wider font-semibold ${textColorClass.includes('slate') ? 'text-slate-200' : 'text-blue-100'}`}>{t('dashboard.totalProjects')}</div>
            </div>
          )}

          {/* Money Received */}
          {(accessibleSections.includes('financial') || !accessibleSections.length) && (
            <div className="text-center p-3 rounded-xl bg-white/15 border border-white/10 backdrop-blur-lg hover:bg-white/25 transition-all duration-300 hover:-translate-y-1 group animate-slide-in" style={{ animationDelay: '450ms' }}>
              <TrendingUp className="h-5 w-5 mx-auto mb-2 opacity-70 group-hover:opacity-100 transition-opacity" />
              <div className="text-2xl font-bold tracking-tight">
                {loading ? (
                  <div className="animate-pulse bg-white/20 h-8 w-16 mx-auto rounded"></div>
                ) : (
                  formatNumber(stats?.monthlyMoneyReceived || 0)
                )}
              </div>
              <div className={`text-[10px] uppercase tracking-wider font-semibold ${textColorClass.includes('slate') ? 'text-slate-200' : 'text-blue-100'}`}>{t('dashboard.moneyReceived')}</div>
            </div>
          )}

          {/* Money Lost */}
          {(accessibleSections.includes('financial') || !accessibleSections.length) && (
            <div className="text-center p-3 rounded-xl bg-white/15 border border-white/10 backdrop-blur-lg hover:bg-white/25 transition-all duration-300 hover:-translate-y-1 group animate-slide-in" style={{ animationDelay: '500ms' }}>
              <TrendingUp
                className="h-5 w-5 mx-auto mb-2 opacity-70 group-hover:opacity-100 transition-opacity"
                style={{ transform: 'rotate(180deg)' }}
              />
              <div className="text-2xl font-bold tracking-tight">
                {loading ? (
                  <div className="animate-pulse bg-white/20 h-8 w-16 mx-auto rounded"></div>
                ) : (
                  formatNumber(stats?.monthlyMoneyLost || 0)
                )}
              </div>
              <div className={`text-[10px] uppercase tracking-wider font-semibold ${textColorClass.includes('slate') ? 'text-slate-200' : 'text-blue-100'}`}>{t('dashboard.moneyLost')}</div>
            </div>
          )}

          {/* Pending Approvals */}
          {(accessibleSections.includes('timesheets') || !accessibleSections.length) && (
            <div className="text-center p-3 rounded-xl bg-white/15 border border-white/10 backdrop-blur-lg hover:bg-white/25 transition-all duration-300 hover:-translate-y-1 group animate-slide-in" style={{ animationDelay: '550ms' }}>
              <AlertTriangle className="h-5 w-5 mx-auto mb-2 opacity-70 group-hover:opacity-100 transition-opacity" />
              <div className="text-2xl font-bold tracking-tight">
                {loading ? (
                  <div className="animate-pulse bg-white/20 h-8 w-12 mx-auto rounded"></div>
                ) : (
                  formatNumber(stats?.pendingApprovals || 0)
                )}
              </div>
              <div className={`text-[10px] uppercase tracking-wider font-semibold ${textColorClass.includes('slate') ? 'text-slate-200' : 'text-blue-100'}`}>{t('dashboard.pendingApprovals')}</div>
            </div>
          )}

          {/* Total Companies */}
          {(accessibleSections.includes('manualAssignments') || !accessibleSections.length) && (
            <div className="text-center p-3 rounded-xl bg-white/15 border border-white/10 backdrop-blur-lg hover:bg-white/25 transition-all duration-300 hover:-translate-y-1 group animate-slide-in" style={{ animationDelay: '600ms' }}>
              <Building2 className="h-5 w-5 mx-auto mb-2 opacity-70 group-hover:opacity-100 transition-opacity" />
              <div className="text-2xl font-bold tracking-tight">
                {loading ? (
                  <div className="animate-pulse bg-white/20 h-8 w-12 mx-auto rounded"></div>
                ) : (
                  formatNumber(stats?.totalCompanies || 0)
                )}
              </div>
              <div className={`text-[10px] uppercase tracking-wider font-semibold ${textColorClass.includes('slate') ? 'text-slate-200' : 'text-blue-100'}`}>{t('dashboard.totalCompanies')}</div>
            </div>
          )}

          {/* Total Equipment */}
          {(accessibleSections.includes('equipment') || !accessibleSections.length) && (
            <div className="text-center p-3 rounded-xl bg-white/15 border border-white/10 backdrop-blur-lg hover:bg-white/25 transition-all duration-300 hover:-translate-y-1 group animate-slide-in" style={{ animationDelay: '650ms' }}>
              <Wrench className="h-5 w-5 mx-auto mb-2 opacity-70 group-hover:opacity-100 transition-opacity" />
              <div className="text-2xl font-bold tracking-tight">
                {loading ? (
                  <div className="animate-pulse bg-white/20 h-8 w-12 mx-auto rounded"></div>
                ) : (
                  formatNumber(stats?.totalEquipment || 0)
                )}
              </div>
              <div className={`text-[10px] uppercase tracking-wider font-semibold ${textColorClass.includes('slate') ? 'text-slate-200' : 'text-blue-100'}`}>{t('dashboard.totalEquipment')}</div>
            </div>
          )}

          {/* Active Rentals */}
          {(accessibleSections.includes('quickActions') || !accessibleSections.length) && (
            <div className="text-center p-3 rounded-xl bg-white/15 border border-white/10 backdrop-blur-lg hover:bg-white/25 transition-all duration-300 hover:-translate-y-1 group animate-slide-in" style={{ animationDelay: '700ms' }}>
              <Truck className="h-5 w-5 mx-auto mb-2 opacity-70 group-hover:opacity-100 transition-opacity" />
              <div className="text-2xl font-bold tracking-tight">
                {loading ? (
                  <div className="animate-pulse bg-white/20 h-8 w-12 mx-auto rounded"></div>
                ) : (
                  formatNumber(stats?.activeRentals || 0)
                )}
              </div>
              <div className={`text-[10px] uppercase tracking-wider font-semibold ${textColorClass.includes('slate') ? 'text-slate-200' : 'text-blue-100'}`}>{t('dashboard.activeRentals')}</div>
            </div>
          )}

          {/* Total Rentals */}
          {(accessibleSections.includes('quickActions') || !accessibleSections.length) && (
            <div className="text-center p-3 rounded-xl bg-white/15 border border-white/10 backdrop-blur-lg hover:bg-white/25 transition-all duration-300 hover:-translate-y-1 group animate-slide-in" style={{ animationDelay: '750ms' }}>
              <Truck className="h-5 w-5 mx-auto mb-2 opacity-70 group-hover:opacity-100 transition-opacity" />
              <div className="text-2xl font-bold tracking-tight">
                {loading ? (
                  <div className="animate-pulse bg-white/20 h-8 w-12 mx-auto rounded"></div>
                ) : (
                  formatNumber(stats?.totalRentals || 0)
                )}
              </div>
              <div className={`text-[10px] uppercase tracking-wider font-semibold ${textColorClass.includes('slate') ? 'text-slate-200' : 'text-blue-100'}`}>{t('dashboard.totalRentals')}</div>
            </div>
          )}

          {/* Total Documents */}
          {(accessibleSections.includes('recentActivity') || !accessibleSections.length) && (
            <div className="text-center p-3 rounded-xl bg-white/15 border border-white/10 backdrop-blur-lg hover:bg-white/25 transition-all duration-300 hover:-translate-y-1 group animate-slide-in" style={{ animationDelay: '800ms' }}>
              <FileText className="h-5 w-5 mx-auto mb-2 opacity-70 group-hover:opacity-100 transition-opacity" />
              <div className="text-2xl font-bold tracking-tight">
                {loading ? (
                  <div className="animate-pulse bg-white/20 h-8 w-12 mx-auto rounded"></div>
                ) : (
                  formatNumber(stats?.totalDocuments || 0)
                )}
              </div>
              <div className={`text-[10px] uppercase tracking-wider font-semibold ${textColorClass.includes('slate') ? 'text-slate-200' : 'text-blue-100'}`}>{t('dashboard.totalDocuments')}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
