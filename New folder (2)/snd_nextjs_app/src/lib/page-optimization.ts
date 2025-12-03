'use client';

import { useState, useEffect } from 'react';

// Page optimization utilities for faster loading

/**
 * Pagination helper for client-side pagination
 */
export function usePagination<T>(data: T[], itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);
  
  return {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedData,
    hasNext: currentPage < totalPages,
    hasPrevious: currentPage > 1,
  };
}

/**
 * Debounce hook for search inputs - improves performance
 */
export function useDebounce<T>(value: T, delay: number = 300) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * Optimized fetch wrapper with caching
 */
export async function optimizedFetch<T>(
  url: string,
  options?: RequestInit,
  cacheTTL: number = 30000
): Promise<T> {
  const cache = typeof window !== 'undefined' && sessionStorage;
  
  if (cache) {
    const cached = sessionStorage.getItem(`fetch_${url}`);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < cacheTTL) {
        return data;
      }
    }
  }
  
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (cache && data.success !== false) {
    sessionStorage.setItem(`fetch_${url}`, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  }
  
  return data;
}

/**
 * Memoized data fetching with dependency tracking
 */
export function useOptimizedData<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let cancelled = false;
    
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchFn();
        
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch data');
          setLoading(false);
        }
      }
    }
    
    fetchData();
    
    return () => {
      cancelled = true;
    };
  }, [...dependencies]);
  
  return { data, loading, error };
}

