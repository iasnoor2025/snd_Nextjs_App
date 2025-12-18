'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { applyThemeColors, resetThemeColors } from '@/lib/utils/theme-colors';

/**
 * ThemeColorProvider - Applies user's preferred color to shadcn UI theme
 * This component should be used inside ThemeProvider from next-themes
 */
export function ThemeColorProvider({ children }: { children: React.ReactNode }) {
  const { theme, resolvedTheme } = useTheme();
  const { data: session } = useSession();
  const [userPreferredColor, setUserPreferredColor] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Determine if we're in dark mode
  const isDark = resolvedTheme === 'dark';

  // Fetch user's preferred color
  useEffect(() => {
    const fetchUserColor = async () => {
      if (!session?.user?.id) {
        setUserPreferredColor(null);
        return;
      }

      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUserPreferredColor(data.user?.preferredColor || null);
        }
      } catch (error) {
        console.error('Error fetching user preferred color:', error);
        setUserPreferredColor(null);
      }
    };

    fetchUserColor();
  }, [session?.user?.id]);

  // Apply theme colors when color preference or theme changes
  useEffect(() => {
    // Wait for theme to be resolved
    if (!mounted || !resolvedTheme) {
      return;
    }

    if (userPreferredColor) {
      applyThemeColors(userPreferredColor, isDark);
    } else {
      resetThemeColors(isDark);
    }
  }, [userPreferredColor, isDark, resolvedTheme, mounted]);

  // Handle mount and theme resolution
  useEffect(() => {
    setMounted(true);
  }, []);

  // Re-apply colors when theme changes
  useEffect(() => {
    if (!mounted || !resolvedTheme) return;

    // Small delay to ensure theme class is applied
    const timeout = setTimeout(() => {
      if (userPreferredColor) {
        applyThemeColors(userPreferredColor, isDark);
      } else {
        resetThemeColors(isDark);
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [theme, resolvedTheme, mounted, userPreferredColor, isDark]);

  return <>{children}</>;
}

