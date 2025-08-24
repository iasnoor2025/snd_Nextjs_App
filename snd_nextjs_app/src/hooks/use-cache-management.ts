import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface CacheStats {
  keys: number;
  memory: string;
  connected: boolean;
}

interface CacheOperation {
  action: string;
  target?: string;
  targets?: string[];
}

export function useCacheManagement() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Get cache statistics
  const { data: cacheStats, refetch: refetchStats } = useQuery<CacheStats>({
    queryKey: ['cache-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/cache');
      if (!response.ok) {
        throw new Error('Failed to fetch cache stats');
      }
      const data = await response.json();
      return data.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Clear all cache
  const clearAllCache = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/cache?action=clear-all', {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to clear all cache');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all React Query cache
      queryClient.clear();
      refetchStats();
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Clear cache by tag
  const clearCacheByTag = useMutation({
    mutationFn: async (tag: string) => {
      const response = await fetch(`/api/admin/cache?action=clear-tag&target=${tag}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Failed to clear cache for tag: ${tag}`);
      }
      return response.json();
    },
    onSuccess: () => {
      refetchStats();
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Clear cache by prefix
  const clearCacheByPrefix = useMutation({
    mutationFn: async (prefix: string) => {
      const response = await fetch(`/api/admin/cache?action=clear-prefix&target=${prefix}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Failed to clear cache for prefix: ${prefix}`);
      }
      return response.json();
    },
    onSuccess: () => {
      refetchStats();
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Clear specific cache types
  const clearDashboardCache = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-dashboard' }),
      });
      if (!response.ok) {
        throw new Error('Failed to clear dashboard cache');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate dashboard-related queries
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      refetchStats();
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const clearEmployeesCache = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-employees' }),
      });
      if (!response.ok) {
        throw new Error('Failed to clear employees cache');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      refetchStats();
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const clearEquipmentCache = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-equipment' }),
      });
      if (!response.ok) {
        throw new Error('Failed to clear equipment cache');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      refetchStats();
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const clearCustomersCache = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-customers' }),
      });
      if (!response.ok) {
        throw new Error('Failed to clear customers cache');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      refetchStats();
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const clearRentalsCache = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-rentals' }),
      });
      if (!response.ok) {
        throw new Error('Failed to clear rentals cache');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      refetchStats();
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Invalidate multiple cache tags
  const invalidateMultipleTags = useMutation({
    mutationFn: async (tags: string[]) => {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'invalidate-multiple', targets: tags }),
      });
      if (!response.ok) {
        throw new Error('Failed to invalidate multiple cache tags');
      }
      return response.json();
    },
    onSuccess: () => {
      refetchStats();
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Manual cache invalidation for specific queries
  const invalidateQuery = (queryKey: string[]) => {
    queryClient.invalidateQueries({ queryKey });
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  return {
    // Data
    cacheStats,
    
    // Loading states
    isLoading: isLoading || 
      clearAllCache.isPending || 
      clearCacheByTag.isPending || 
      clearCacheByPrefix.isPending ||
      clearDashboardCache.isPending ||
      clearEmployeesCache.isPending ||
      clearEquipmentCache.isPending ||
      clearCustomersCache.isPending ||
      clearRentalsCache.isPending ||
      invalidateMultipleTags.isPending,
    
    // Error handling
    error,
    clearError,
    
    // Actions
    clearAllCache: clearAllCache.mutate,
    clearCacheByTag: clearCacheByTag.mutate,
    clearCacheByPrefix: clearCacheByPrefix.mutate,
    clearDashboardCache: clearDashboardCache.mutate,
    clearEmployeesCache: clearEmployeesCache.mutate,
    clearEquipmentCache: clearEquipmentCache.mutate,
    clearCustomersCache: clearCustomersCache.mutate,
    clearRentalsCache: clearRentalsCache.mutate,
    invalidateMultipleTags: invalidateMultipleTags.mutate,
    invalidateQuery,
    refetchStats,
  };
}
