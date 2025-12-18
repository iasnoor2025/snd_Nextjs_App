/**
 * Utility functions for role-based color theming
 * Provides consistent color mapping across the application
 */

export type RoleColorType = 'avatar' | 'badge' | 'header' | 'gradient' | 'border' | 'spinner';

/**
 * Map color name to Tailwind classes for different UI elements
 */
export function getRoleColorClasses(
  colorName: string | null | undefined,
  type: RoleColorType = 'header'
): string {
  if (!colorName) {
    // Return default based on type
    const defaults: Record<RoleColorType, string> = {
      avatar: 'bg-blue-500',
      badge: 'bg-blue-600 text-white border-blue-700',
      header: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
      gradient: 'bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800',
      border: 'border-blue-200 dark:border-blue-800',
      spinner: 'border-blue-600',
    };
    return defaults[type];
  }

  const colorMap: Record<string, Record<RoleColorType, string>> = {
    red: {
      avatar: 'bg-red-500',
      badge: 'bg-red-600 text-white border-red-700',
      header: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
      gradient: 'bg-gradient-to-r from-red-600 via-red-700 to-red-800',
      border: 'border-red-200 dark:border-red-800',
      spinner: 'border-red-600',
    },
    blue: {
      avatar: 'bg-blue-500',
      badge: 'bg-blue-600 text-white border-blue-700',
      header: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
      gradient: 'bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800',
      border: 'border-blue-200 dark:border-blue-800',
      spinner: 'border-blue-600',
    },
    purple: {
      avatar: 'bg-purple-500',
      badge: 'bg-purple-600 text-white border-purple-700',
      header: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800',
      gradient: 'bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800',
      border: 'border-purple-200 dark:border-purple-800',
      spinner: 'border-purple-600',
    },
    orange: {
      avatar: 'bg-orange-500',
      badge: 'bg-orange-100 text-orange-800 border-orange-300',
      header: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800',
      gradient: 'bg-gradient-to-r from-orange-600 via-orange-700 to-orange-800',
      border: 'border-orange-200 dark:border-orange-800',
      spinner: 'border-orange-600',
    },
    green: {
      avatar: 'bg-green-500',
      badge: 'bg-green-100 text-green-800 border-green-300',
      header: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
      gradient: 'bg-gradient-to-r from-green-600 via-green-700 to-green-800',
      border: 'border-green-200 dark:border-green-800',
      spinner: 'border-green-600',
    },
    gray: {
      avatar: 'bg-gray-500',
      badge: 'bg-gray-100 text-gray-800 border-gray-300',
      header: 'bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800',
      gradient: 'bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800',
      border: 'border-gray-200 dark:border-gray-800',
      spinner: 'border-gray-600',
    },
    slate: {
      avatar: 'bg-slate-500',
      badge: 'bg-slate-100 text-slate-700 border-slate-300',
      header: 'bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800',
      gradient: 'bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800',
      border: 'border-slate-200 dark:border-slate-800',
      spinner: 'border-slate-600',
    },
    indigo: {
      avatar: 'bg-indigo-500',
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      header: 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800',
      gradient: 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800',
      border: 'border-indigo-200 dark:border-indigo-800',
      spinner: 'border-indigo-600',
    },
    teal: {
      avatar: 'bg-teal-500',
      badge: 'bg-teal-100 text-teal-800 border-teal-300',
      header: 'bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800',
      gradient: 'bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800',
      border: 'border-teal-200 dark:border-teal-800',
      spinner: 'border-teal-600',
    },
    pink: {
      avatar: 'bg-pink-500',
      badge: 'bg-pink-100 text-pink-800 border-pink-300',
      header: 'bg-pink-50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-800',
      gradient: 'bg-gradient-to-r from-pink-600 via-pink-700 to-pink-800',
      border: 'border-pink-200 dark:border-pink-800',
      spinner: 'border-pink-600',
    },
    cyan: {
      avatar: 'bg-cyan-500',
      badge: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      header: 'bg-cyan-50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-800',
      gradient: 'bg-gradient-to-r from-cyan-600 via-cyan-700 to-cyan-800',
      border: 'border-cyan-200 dark:border-cyan-800',
      spinner: 'border-cyan-600',
    },
    amber: {
      avatar: 'bg-amber-500',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      header: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
      gradient: 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800',
      border: 'border-amber-200 dark:border-amber-800',
      spinner: 'border-amber-600',
    },
    emerald: {
      avatar: 'bg-emerald-500',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      header: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800',
      gradient: 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800',
      border: 'border-emerald-200 dark:border-emerald-800',
      spinner: 'border-emerald-600',
    },
    violet: {
      avatar: 'bg-violet-500',
      badge: 'bg-violet-100 text-violet-800 border-violet-300',
      header: 'bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800',
      gradient: 'bg-gradient-to-r from-violet-600 via-violet-700 to-violet-800',
      border: 'border-violet-200 dark:border-violet-800',
      spinner: 'border-violet-600',
    },
    rose: {
      avatar: 'bg-rose-500',
      badge: 'bg-rose-100 text-rose-800 border-rose-300',
      header: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800',
      gradient: 'bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800',
      border: 'border-rose-200 dark:border-rose-800',
      spinner: 'border-rose-600',
    },
  };

  const normalizedColor = colorName.toLowerCase();
  const colorClasses = colorMap[normalizedColor];
  
  if (colorClasses && colorClasses[type]) {
    return colorClasses[type];
  }

  // Fallback to default
  const defaults: Record<RoleColorType, string> = {
    avatar: 'bg-blue-500',
    badge: 'bg-blue-600 text-white border-blue-700',
    header: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
    gradient: 'bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800',
    border: 'border-blue-200 dark:border-blue-800',
    spinner: 'border-blue-600',
  };
  return defaults[type];
}

/**
 * Get role color with fallback to hardcoded colors for known roles
 * @param role - User's role name
 * @param roleColor - Role color from database (optional)
 * @param type - Type of color class needed
 * @param userPreferredColor - User's preferred color (optional, overrides role color)
 */
export function getRoleColorByRoleName(
  role: string,
  roleColor?: string | null,
  type: RoleColorType = 'header',
  userPreferredColor?: string | null
): string {
  // First, check if user has a preferred color (highest priority)
  if (userPreferredColor) {
    const userColor = getRoleColorClasses(userPreferredColor, type);
    if (userColor) return userColor;
  }

  // Second, try to use color from database (role color)
  if (roleColor) {
    const dbColor = getRoleColorClasses(roleColor, type);
    if (dbColor) return dbColor;
  }

  // Fallback to hardcoded colors for known roles
  const roleUpper = role.toUpperCase();
  const roleColorMap: Record<string, string> = {
    'SUPER_ADMIN': 'red',
    'ADMIN': 'blue',
    'MANAGER': 'purple',
    'SUPERVISOR': 'orange',
    'OPERATOR': 'green',
    'EMPLOYEE': 'gray',
    'USER': 'slate',
  };

  const colorName = roleColorMap[roleUpper];
  if (colorName) {
    return getRoleColorClasses(colorName, type);
  }

  // For custom roles without color, use hash-based auto-assignment
  const roleHash = role.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorOptions = ['indigo', 'teal', 'pink', 'cyan', 'amber', 'emerald', 'violet', 'rose'];
  const selectedColor = colorOptions[roleHash % colorOptions.length];
  
  return getRoleColorClasses(selectedColor, type);
}

