import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CacheStats {
  keys: number;
  memory: string;
  connected: boolean;
}

interface CacheAction {
  action: string;
  target?: string;
}

export function useCacheManagement() {
  const queryClient = useQueryClient();

  // Get cache statistics
  const {
    data: cacheStats,
    isLoading,
    error,
    refetch: refetchStats,
  } = useQuery<CacheStats>({
    queryKey: ['cache-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/cache');
      if (!response.ok) {
        throw new Error('Failed to fetch cache stats');
      }
      return response.json();
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
      queryClient.invalidateQueries();
      refetchStats();
    },
  });

  // Clear cache by tag
  const clearCacheByTag = useMutation({
    mutationFn: async (tag: string) => {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-by-tag', target: tag }),
      });
      if (!response.ok) {
        throw new Error(`Failed to clear cache for tag: ${tag}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      refetchStats();
    },
  });

  // Clear cache by prefix
  const clearCacheByPrefix = useMutation({
    mutationFn: async (prefix: string) => {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-by-prefix', target: prefix }),
      });
      if (!response.ok) {
        throw new Error(`Failed to clear cache for prefix: ${prefix}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      refetchStats();
    },
  });

  // Specific cache clearing functions
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
      queryClient.invalidateQueries();
      refetchStats();
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
      queryClient.invalidateQueries();
      refetchStats();
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
      queryClient.invalidateQueries();
      refetchStats();
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
      queryClient.invalidateQueries();
      refetchStats();
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
      queryClient.invalidateQueries();
      refetchStats();
    },
  });

  const clearUsersCache = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-users' }),
      });
      if (!response.ok) {
        throw new Error('Failed to clear users cache');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      refetchStats();
    },
  });

  const clearRolesCache = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-roles' }),
      });
      if (!response.ok) {
        throw new Error('Failed to clear roles cache');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      refetchStats();
    },
  });

  const clearPermissionsCache = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-permissions' }),
      });
      if (!response.ok) {
        throw new Error('Failed to clear permissions cache');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      refetchStats();
    },
  });

  const clearSkillsCache = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-skills' }),
      });
      if (!response.ok) {
        throw new Error('Failed to clear skills cache');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      refetchStats();
    },
  });

  const clearTrainingsCache = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-trainings' }),
      });
      if (!response.ok) {
        throw new Error('Failed to clear trainings cache');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      refetchStats();
    },
  });

  const clearLocationsCache = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-locations' }),
      });
      if (!response.ok) {
        throw new Error('Failed to clear locations cache');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      refetchStats();
    },
  });

  const clearSettingsCache = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-settings' }),
      });
      if (!response.ok) {
        throw new Error('Failed to clear settings cache');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      refetchStats();
    },
  });

  const clearAnalyticsCache = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-analytics' }),
      });
      if (!response.ok) {
        throw new Error('Failed to clear analytics cache');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      refetchStats();
    },
  });

  const clearReportsCache = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-reports' }),
      });
      if (!response.ok) {
        throw new Error('Failed to clear reports cache');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      refetchStats();
    },
  });

  const clearPayrollCache = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-payroll' }),
      });
      if (!response.ok) {
        throw new Error('Failed to clear payroll cache');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      refetchStats();
    },
  });

  const clearQuotationsCache = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-quotations' }),
      });
      if (!response.ok) {
        throw new Error('Failed to clear quotations cache');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      refetchStats();
    },
  });

  const clearInvoicesCache = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-invoices' }),
      });
      if (!response.ok) {
        throw new Error('Failed to clear invoices cache');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      refetchStats();
    },
  });

  const clearSystemCache = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-system' }),
      });
      if (!response.ok) {
        throw new Error('Failed to clear system cache');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      refetchStats();
    },
  });

  return {
    // Cache statistics
    cacheStats,
    isLoading,
    error,
    refetchStats,

    // Cache clearing functions
    clearAllCache,
    clearCacheByTag,
    clearCacheByPrefix,
    clearDashboardCache,
    clearEmployeesCache,
    clearEquipmentCache,
    clearCustomersCache,
    clearRentalsCache,
    clearUsersCache,
    clearRolesCache,
    clearPermissionsCache,
    clearSkillsCache,
    clearTrainingsCache,
    clearLocationsCache,
    clearSettingsCache,
    clearAnalyticsCache,
    clearReportsCache,
    clearPayrollCache,
    clearQuotationsCache,
    clearInvoicesCache,
    clearSystemCache,
  };
}
