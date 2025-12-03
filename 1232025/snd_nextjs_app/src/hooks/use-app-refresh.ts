'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Utility hook to replace window.location.reload() calls
 * Provides methods to update state and refresh data without full page reload
 */
export function useAppRefresh() {
  const router = useRouter();

  /**
   * Refresh current page data without full reload
   * Only refreshes router cache, not full page
   */
  const refreshData = useCallback(() => {
    router.refresh();
  }, [router]);

  /**
   * Navigate to a new route (replaces window.location.href)
   */
  const navigateTo = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  /**
   * Replace current route (replaces window.location.replace)
   */
  const replaceRoute = useCallback((path: string) => {
    router.replace(path);
  }, [router]);

  /**
   * Update state and refresh data after mutation
   * This is the recommended way to update UI after mutations
   */
  const updateAndRefresh = useCallback(async (
    updateFn: () => Promise<void>,
    refreshFn?: () => Promise<void>
  ) => {
    try {
      await updateFn();
      if (refreshFn) {
        await refreshFn();
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error('Error updating and refreshing:', error);
      throw error;
    }
  }, [router]);

  return {
    refreshData,
    navigateTo,
    replaceRoute,
    updateAndRefresh,
  };
}

