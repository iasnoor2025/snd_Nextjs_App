import { useCallback, useEffect, useState } from 'react';

interface PerformanceMetrics {
  fcp: number | null;
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  ttfb: number | null;
  memory: {
    used: number | null;
    total: number | null;
    limit: number | null;
    usage: number | null;
  } | null;
}

interface UsePerformanceOptions {
  trackMemory?: boolean;
  trackWebVitals?: boolean;
  onMetricUpdate?: (metrics: PerformanceMetrics) => void;
}

export function usePerformance(options: UsePerformanceOptions = {}) {
  const { trackMemory = true, trackWebVitals = true, onMetricUpdate } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    memory: null,
  });

  const updateMetrics = useCallback(
    (newMetrics: Partial<PerformanceMetrics>) => {
      setMetrics(prev => {
        const updated = { ...prev, ...newMetrics };
        onMetricUpdate?.(updated);
        return updated;
      });
    },
    [onMetricUpdate]
  );

  // Track Core Web Vitals
  useEffect(() => {
    if (!trackWebVitals || typeof window === 'undefined') return;

    // First Contentful Paint (FCP)
    const fcpObserver = new PerformanceObserver(list => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        updateMetrics({ fcp: fcpEntry.startTime });
      }
    });

    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver(list => {
      const entries = list.getEntries();
      const lcpEntry = entries[entries.length - 1];
      if (lcpEntry) {
        updateMetrics({ lcp: lcpEntry.startTime });
      }
    });

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver(list => {
      const entries = list.getEntries();
      const fidEntry = entries[entries.length - 1];
      if (fidEntry && 'startTime' in fidEntry && 'duration' in fidEntry) {
        updateMetrics({ fid: fidEntry.duration });
      }
    });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver(list => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      updateMetrics({ cls: clsValue });
    });

    // Time to First Byte (TTFB)
    const navigationEntry = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      updateMetrics({ ttfb: navigationEntry.responseStart - navigationEntry.requestStart });
    }

    try {
      fcpObserver.observe({ entryTypes: ['paint'] });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      fidObserver.observe({ entryTypes: ['first-input'] });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }

    return () => {
      fcpObserver.disconnect();
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
    };
  }, [trackWebVitals, updateMetrics]);

  // Track memory usage
  useEffect(() => {
    if (!trackMemory || typeof window === 'undefined') return;

    const updateMemoryMetrics = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        updateMetrics({
          memory: {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit,
            usage: memory.usedJSHeapSize / memory.jsHeapSizeLimit,
          },
        });
      }
    };

    // Update memory metrics every 5 seconds
    const interval = setInterval(updateMemoryMetrics, 5000);
    updateMemoryMetrics(); // Initial update

    return () => clearInterval(interval);
  }, [trackMemory, updateMetrics]);

  // Get performance score based on metrics
  const getPerformanceScore = useCallback(() => {
    let score = 100;
    let factors = 0;

    // FCP scoring (0-100)
    if (metrics.fcp !== null) {
      factors++;
      if (metrics.fcp <= 1800) score -= 0;
      else if (metrics.fcp <= 3000) score -= 10;
      else score -= 20;
    }

    // LCP scoring (0-100)
    if (metrics.lcp !== null) {
      factors++;
      if (metrics.lcp <= 2500) score -= 0;
      else if (metrics.lcp <= 4000) score -= 10;
      else score -= 20;
    }

    // FID scoring (0-100)
    if (metrics.fid !== null) {
      factors++;
      if (metrics.fid <= 100) score -= 0;
      else if (metrics.fid <= 300) score -= 10;
      else score -= 20;
    }

    // CLS scoring (0-100)
    if (metrics.cls !== null) {
      factors++;
      if (metrics.cls <= 0.1) score -= 0;
      else if (metrics.cls <= 0.25) score -= 10;
      else score -= 20;
    }

    return factors > 0 ? Math.max(0, score / factors) : 100;
  }, [metrics]);

  // Check if metrics meet Core Web Vitals thresholds
  const meetsCoreWebVitals = useCallback(() => {
    return (
      (metrics.fcp === null || metrics.fcp <= 1800) &&
      (metrics.lcp === null || metrics.lcp <= 2500) &&
      (metrics.fid === null || metrics.fid <= 100) &&
      (metrics.cls === null || metrics.cls <= 0.1)
    );
  }, [metrics]);

  return {
    metrics,
    performanceScore: getPerformanceScore(),
    meetsCoreWebVitals: meetsCoreWebVitals(),
    updateMetrics,
  };
}
