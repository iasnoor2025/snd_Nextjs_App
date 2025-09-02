'use client';

import { I18nProvider } from '@/components/i18n-provider';
import { ConfirmationProvider } from '@/components/providers/confirmation-provider';
import { NotificationProvider } from '@/contexts/notification-context';
import SSEProvider from '@/contexts/sse-context';
import ErrorBoundary from '@/components/error-boundary';
import { addCleanupCallback, startMemoryMonitoring } from '@/lib/memory-manager';
import { RBACProvider } from '@/lib/rbac/rbac-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { lazy, Suspense, useEffect, useMemo } from 'react';

// Dynamic imports for heavy components with better chunking
const ReactQueryDevtools = lazy(() =>
  import('@tanstack/react-query-devtools').then(mod => ({
    default: mod.ReactQueryDevtools,
  }))
);

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Memoize QueryClient to prevent unnecessary re-renders
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors
              if (error?.status >= 400 && error?.status < 500) {
                return false;
              }
              return failureCount < 2;
            },
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: true,
            // Optimistic updates for better perceived performance
            placeholderData: (previousData: any) => previousData,
          },
          mutations: {
            retry: 1,
            onError: (error: any) => {
              
            },
          },
        },
      }),
    []
  );

  // Optimized cleanup function with reduced frequency
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear queries on page unload
      queryClient.clear();
    };

    const handleVisibilityChange = () => {
      // Only clear stale queries when page is hidden for extended time
      if (document.hidden) {
        setTimeout(() => {
          if (document.hidden) {
            // Only clear if memory usage is high
            const memoryStats = (performance as any).memory;
            if (memoryStats && memoryStats.usedJSHeapSize > memoryStats.jsHeapSizeLimit * 0.8) {
              queryClient.clear();
            }
          }
        }, 60000); // 1 minute delay
      }
    };

    // Add cleanup callback to memory manager
    const cleanupCallback = () => {
      const memoryStats = (performance as any).memory;
      if (memoryStats && memoryStats.usedJSHeapSize > memoryStats.jsHeapSizeLimit * 0.8) {
        queryClient.clear();
      }
    };
    addCleanupCallback(cleanupCallback);

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start memory monitoring with higher threshold and longer interval
    startMemoryMonitoring(90, 120000); // Monitor every 2 minutes, cleanup if >90% usage

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient]);

  return (
    <ErrorBoundary>
      <SessionProvider>
        <RBACProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            storageKey="theme"
          >
            <QueryClientProvider client={queryClient}>
              <SSEProvider>
                <I18nProvider>
                  <ConfirmationProvider>
                    <NotificationProvider>{children}</NotificationProvider>
                  </ConfirmationProvider>
                </I18nProvider>
                {/* Only load devtools in development */}
                {process.env.NODE_ENV === 'development' && (
                  <Suspense fallback={null}>
                    <div className="fixed bottom-4 right-4 z-50">
                      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
                    </div>
                  </Suspense>
                )}
              </SSEProvider>
            </QueryClientProvider>
          </ThemeProvider>
        </RBACProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
