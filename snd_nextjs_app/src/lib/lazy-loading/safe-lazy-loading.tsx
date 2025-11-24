/**
 * Safe Advanced Lazy Loading & Code Splitting Utilities
 * Provides advanced lazy loading without breaking existing functionality
 * All methods are safe and non-breaking
 */

import React, { ComponentType, Suspense, lazy, ReactNode } from 'react';
import ErrorBoundary from '@/components/error-boundary';

interface LazyComponentOptions {
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  retryDelay?: number;
  maxRetries?: number;
  preload?: boolean;
  preloadDelay?: number;
}

interface LazyComponentState {
  Component: ComponentType<any> | null;
  error: Error | null;
  retryCount: number;
  isLoading: boolean;
}

/**
 * Safe lazy component loader with advanced features
 * Safe method that won't break existing functionality
 */
export function createSafeLazyComponent<T = any>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: LazyComponentOptions = {}
) {
  const {
    fallback = <div>Loading...</div>,
    errorFallback = <div>Error loading component</div>,
    retryDelay = 1000,
    maxRetries = 3,
    preload = false,
    preloadDelay = 0
  } = options;

  const LazyComponent = lazy(importFn);

  // Preload component if requested
  if (preload) {
    setTimeout(() => {
      importFn().catch(() => {
        // Silently fail preload
      });
    }, preloadDelay);
  }

  return function SafeLazyComponent(props: T) {
    return (
      <ErrorBoundary fallback={errorFallback}>
        <Suspense fallback={fallback}>
          <LazyComponent {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };
}

/**
 * Safe route-based lazy loading
 * Safe method for route-level code splitting
 */
export function createSafeLazyRoute<T = any>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: LazyComponentOptions = {}
) {
  return createSafeLazyComponent(importFn, {
    fallback: <div>Loading page...</div>,
    errorFallback: <div>Error loading page</div>,
    ...options
  });
}

/**
 * Safe module-based lazy loading
 * Safe method for module-level code splitting
 */
export function createSafeLazyModule<T = any>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: LazyComponentOptions = {}
) {
  return createSafeLazyComponent(importFn, {
    fallback: <div>Loading module...</div>,
    errorFallback: <div>Error loading module</div>,
    ...options
  });
}

/**
 * Safe component-based lazy loading
 * Safe method for component-level code splitting
 */


/**
 * Safe hook-based lazy loading
 * Safe method for hook-level code splitting
 */
export function createSafeLazyHook<T = any>(
  importFn: () => Promise<{ default: T }>
): () => T | null {
  let hook: T | null = null;
  let isLoading = false;
  let error: Error | null = null;

  return function useSafeLazyHook(): T | null {
    if (hook) return hook;
    if (error) throw error;
    if (isLoading) return null;

    isLoading = true;
    importFn()
      .then(module => {
        hook = module.default;
        isLoading = false;
      })
      .catch(err => {
        error = err;
        isLoading = false;
      });

    return null;
  };
}

/**
 * Safe service-based lazy loading
 * Safe method for service-level code splitting
 */
export function createSafeLazyService<T = any>(
  importFn: () => Promise<{ default: T }>
): () => Promise<T> {
  let service: T | null = null;
  let servicePromise: Promise<T> | null = null;

  return function getSafeLazyService(): Promise<T> {
    if (service) return Promise.resolve(service);
    if (servicePromise) return servicePromise;

    servicePromise = importFn()
      .then(module => {
        service = module.default;
        return service;
      })
      .catch(error => {
        servicePromise = null;
        throw error;
      });

    return servicePromise;
  };
}

/**
 * Safe utility-based lazy loading
 * Safe method for utility-level code splitting
 */
export function createSafeLazyUtility<T = any>(
  importFn: () => Promise<{ default: T }>
): () => Promise<T> {
  let utility: T | null = null;
  let utilityPromise: Promise<T> | null = null;

  return function getSafeLazyUtility(): Promise<T> {
    if (utility) return Promise.resolve(utility);
    if (utilityPromise) return utilityPromise;

    utilityPromise = importFn()
      .then(module => {
        utility = module.default;
        return utility;
      })
      .catch(error => {
        utilityPromise = null;
        throw error;
      });

    return utilityPromise;
  };
}

/**
 * Safe preloader for components
 * Safe method for component preloading
 */
export class SafeComponentPreloader {
  private preloadedComponents = new Set<string>();
  private preloadPromises = new Map<string, Promise<any>>();

  /**
   * Preload a component
   * Safe method for component preloading
   */
  preload(name: string, importFn: () => Promise<any>): Promise<any> {
    if (this.preloadedComponents.has(name)) {
      return Promise.resolve();
    }

    if (this.preloadPromises.has(name)) {
      return this.preloadPromises.get(name)!;
    }

    const promise = importFn()
      .then(module => {
        this.preloadedComponents.add(name);
        this.preloadPromises.delete(name);
        return module;
      })
      .catch(error => {
        this.preloadPromises.delete(name);
        throw error;
      });

    this.preloadPromises.set(name, promise);
    return promise;
  }

  /**
   * Check if component is preloaded
   * Safe method for preload status checking
   */
  isPreloaded(name: string): boolean {
    return this.preloadedComponents.has(name);
  }

  /**
   * Get preload status
   * Safe method for preload monitoring
   */
  getStatus(): {
    preloaded: string[];
    loading: string[];
    total: number;
  } {
    return {
      preloaded: Array.from(this.preloadedComponents),
      loading: Array.from(this.preloadPromises.keys()),
      total: this.preloadedComponents.size + this.preloadPromises.size
    };
  }

  /**
   * Clear preloaded components
   * Safe method for cleanup
   */
  clear(): void {
    this.preloadedComponents.clear();
    this.preloadPromises.clear();
  }
}

// Global preloader instance
export const componentPreloader = new SafeComponentPreloader();

/**
 * Safe intersection observer for lazy loading
 * Safe method for viewport-based lazy loading
 */
export function createSafeIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (typeof window === 'undefined') return null;

  try {
    return new IntersectionObserver(callback, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    });
  } catch (error) {
    // Silently fail if IntersectionObserver is not supported
    return null;
  }
}

/**
 * Safe lazy loading hook with intersection observer
 * Safe method for viewport-based lazy loading
 */
export function useSafeLazyLoading(
  ref: React.RefObject<HTMLElement>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (!ref.current) return;

    const observer = createSafeIntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer?.unobserve(entry.target);
          }
        });
      },
      options
    );

    if (observer) {
      observer.observe(ref.current);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [ref, options]);

  return isVisible;
}

/**
 * Safe dynamic import with error handling
 * Safe method for dynamic imports
 */
export async function safeDynamicImport<T = any>(
  importFn: () => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    return await importFn();
  } catch (error) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw error;
  }
}

/**
 * Safe module federation loader
 * Safe method for module federation
 */
export function createSafeModuleFederationLoader<T = any>(
  remoteName: string,
  moduleName: string,
  fallback?: T
): () => Promise<T> {
  return async () => {
    try {
      // @ts-ignore - Module federation types
      const container = window[remoteName];
      if (!container) {
        throw new Error(`Remote ${remoteName} not found`);
      }

      const factory = await container.get(moduleName);
      const module = factory();
      return module.default || module;
    } catch (error) {
      if (fallback !== undefined) {
        return fallback;
      }
      throw error;
    }
  };
}

// Utility functions for common patterns
export const LazyLoadingUtils = {
  /**
   * Lazy load employee management components
   */
  // EmployeeManagement: createSafeLazyModule(
  //   () => import('@/components/employee/EmployeeManagement'),
  //   { fallback: <div>Loading employee management...</div> }
  // ),

  /**
   * Lazy load equipment management components
   */
  // EquipmentManagement: createSafeLazyModule(
  //   () => import('@/components/equipment/EquipmentManagement'),
  //   { fallback: <div>Loading equipment management...</div> }
  // ),

  /**
   * Lazy load project management components
   */
  // ProjectManagement: createSafeLazyModule(
  //   () => import('@/components/project/ProjectManagement'),
  //   { fallback: <div>Loading project management...</div> }
  // ),

  /**
   * Lazy load rental management components
   */
  // RentalManagement: createSafeLazyModule(
  //   () => import('@/components/rental/RentalManagement'),
  //   { fallback: <div>Loading rental management...</div> }
  // ),

  /**
   * Lazy load reporting components
   */
  // Reporting: createSafeLazyModule(
  //   () => import('@/components/reporting/Reporting'),
  //   { fallback: <div>Loading reporting...</div> }
  // ),

  /**
   * Lazy load dashboard components
   */
  // Dashboard: createSafeLazyModule(
  //   () => import('@/components/dashboard/Dashboard'),
  //   { fallback: <div>Loading dashboard...</div> }
  // ),

  /**
   * Lazy load performance components
   */
  // Performance: createSafeLazyModule(
  //   () => import('@/components/performance/PerformanceDashboard'),
  //   { fallback: <div>Loading performance dashboard...</div> }
  // ),

  /**
   * Lazy load chart components
   */
  // Charts: createSafeLazyModule(
  //   () => import('@/components/charts/ChartComponents'),
  //   { fallback: <div>Loading charts...</div> }
  // ),

  /**
   * Lazy load form components
   */
  // Forms: createSafeLazyModule(
  //   () => import('@/components/forms/FormComponents'),
  //   { fallback: <div>Loading forms...</div> }
  // ),

  /**
   * Lazy load table components
   */
  // Tables: createSafeLazyModule(
  //   () => import('@/components/tables/TableComponents'),
  //   { fallback: <div>Loading tables...</div> }
  // )
};

// Export for use in other files
export default {
  createSafeLazyComponent,
  createSafeLazyRoute,
  createSafeLazyModule,
  createSafeLazyHook,
  createSafeLazyService,
  createSafeLazyUtility,
  componentPreloader,
  createSafeIntersectionObserver,
  useSafeLazyLoading,
  safeDynamicImport,
  createSafeModuleFederationLoader,
  LazyLoadingUtils
};
