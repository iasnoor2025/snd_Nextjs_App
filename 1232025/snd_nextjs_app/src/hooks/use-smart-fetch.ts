'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePerformanceCache } from './use-performance-cache';

interface UseSmartFetchOptions<T> {
  /**
   * Function to fetch data
   */
  fetchFn: () => Promise<T>;
  
  /**
   * Cache key for storing/retrieving data
   */
  cacheKey?: string;
  
  /**
   * Cache TTL in milliseconds (default: 5 minutes)
   */
  cacheTTL?: number;
  
  /**
   * Dependencies that trigger refetch when changed
   */
  dependencies?: any[];
  
  /**
   * Only fetch if data doesn't exist (default: true)
   */
  skipIfDataExists?: boolean;
  
  /**
   * Current data - if provided, will skip fetch if data exists
   */
  currentData?: T | null;
  
  /**
   * Only fetch when condition is true
   */
  enabled?: boolean;
  
  /**
   * Callback when data is fetched
   */
  onSuccess?: (data: T) => void;
  
  /**
   * Callback when fetch fails
   */
  onError?: (error: Error) => void;
}

interface UseSmartFetchReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Smart data fetching hook that:
 * - Checks cache before fetching
 * - Skips fetch if data already exists
 * - Only fetches when dependencies change
 * - Prevents unnecessary refetches
 */
export function useSmartFetch<T>({
  fetchFn,
  cacheKey,
  cacheTTL = 300000, // 5 minutes default
  dependencies = [],
  skipIfDataExists = true,
  currentData,
  enabled = true,
  onSuccess,
  onError,
}: UseSmartFetchOptions<T>): UseSmartFetchReturn<T> {
  const cache = usePerformanceCache();
  const [data, setData] = useState<T | null>(currentData ?? null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastDependenciesRef = useRef<string>('');

  // Generate dependency key for comparison
  const dependencyKey = JSON.stringify(dependencies);

  // Check if dependencies changed
  const dependenciesChanged = lastDependenciesRef.current !== dependencyKey;

  const fetchData = useCallback(async (force = false) => {
    // Skip if disabled
    if (!enabled) {
      return;
    }

    // Skip if data exists and we're not forcing
    if (skipIfDataExists && !force && currentData !== null && currentData !== undefined) {
      setLoading(false);
      return;
    }

    // Skip if already fetched and dependencies haven't changed
    if (!force && hasFetched && !dependenciesChanged) {
      return;
    }

    // Check cache first if cacheKey provided
    if (cacheKey && !force) {
      const cached = cache.get<T>(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        setError(null);
        setHasFetched(true);
        onSuccess?.(cached);
        return;
      }
    }

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const result = await fetchFn();

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setData(result);
      setHasFetched(true);

      // Cache the result if cacheKey provided
      if (cacheKey) {
        cache.set(cacheKey, result, cacheTTL);
      }

      onSuccess?.(result);
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [
    fetchFn,
    cacheKey,
    cacheTTL,
    skipIfDataExists,
    currentData,
    enabled,
    hasFetched,
    dependenciesChanged,
    cache,
    onSuccess,
    onError,
  ]);

  // Fetch data when dependencies change or on mount
  useEffect(() => {
    // Update dependency reference
    lastDependenciesRef.current = dependencyKey;

    // Initial fetch
    if (!hasFetched || dependenciesChanged) {
      fetchData(false);
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [dependencyKey, fetchData, hasFetched, dependenciesChanged]);

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook for tab-based lazy loading
 * Only fetches data when a specific tab becomes active
 */
export function useTabBasedFetch<T>({
  tabs,
  activeTab,
  fetchFn,
  cacheKey,
  cacheTTL = 300000,
}: {
  tabs: Record<string, () => Promise<T>>;
  activeTab: string;
  fetchFn?: () => Promise<T>;
  cacheKey?: string;
  cacheTTL?: number;
}) {
  const cache = usePerformanceCache();
  const [data, setData] = useState<Record<string, T>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string | null>>({});
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Skip if tab already loaded
    if (loadedTabs.has(activeTab)) {
      return;
    }

    // Get fetch function for this tab
    const tabFetchFn = tabs[activeTab] || fetchFn;
    if (!tabFetchFn) {
      return;
    }

    // Check cache first
    const tabCacheKey = cacheKey ? `${cacheKey}:${activeTab}` : undefined;
    if (tabCacheKey) {
      const cached = cache.get<T>(tabCacheKey);
      if (cached) {
        setData((prev) => ({ ...prev, [activeTab]: cached }));
        setLoading((prev) => ({ ...prev, [activeTab]: false }));
        setLoadedTabs((prev) => new Set(prev).add(activeTab));
        return;
      }
    }

    // Fetch data for active tab
    setLoading((prev) => ({ ...prev, [activeTab]: true }));
    setError((prev) => ({ ...prev, [activeTab]: null }));

    tabFetchFn()
      .then((result) => {
        setData((prev) => ({ ...prev, [activeTab]: result }));
        setLoading((prev) => ({ ...prev, [activeTab]: false }));
        setError((prev) => ({ ...prev, [activeTab]: null }));
        setLoadedTabs((prev) => new Set(prev).add(activeTab));

        // Cache the result
        if (tabCacheKey) {
          cache.set(tabCacheKey, result, cacheTTL);
        }
      })
      .catch((err) => {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
        setError((prev) => ({ ...prev, [activeTab]: errorMessage }));
        setLoading((prev) => ({ ...prev, [activeTab]: false }));
      });
  }, [activeTab, tabs, fetchFn, cacheKey, cacheTTL, loadedTabs, cache]);

  return {
    data: data[activeTab] ?? null,
    loading: loading[activeTab] ?? false,
    error: error[activeTab] ?? null,
    allData: data,
    refetchTab: async (tab: string) => {
      const tabFetchFn = tabs[tab] || fetchFn;
      if (!tabFetchFn) return;

      setLoading((prev) => ({ ...prev, [tab]: true }));
      try {
        const result = await tabFetchFn();
        setData((prev) => ({ ...prev, [tab]: result }));
        setLoading((prev) => ({ ...prev, [tab]: false }));

        const tabCacheKey = cacheKey ? `${cacheKey}:${tab}` : undefined;
        if (tabCacheKey) {
          cache.set(tabCacheKey, result, cacheTTL);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
        setError((prev) => ({ ...prev, [tab]: errorMessage }));
        setLoading((prev) => ({ ...prev, [tab]: false }));
      }
    },
  };
}

