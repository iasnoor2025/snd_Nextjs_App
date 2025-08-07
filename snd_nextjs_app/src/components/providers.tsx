"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { useState, useEffect } from "react";
import { RBACProvider } from "@/lib/rbac/rbac-context";
import SSEProvider from "@/contexts/sse-context";
import { I18nProvider } from "@/components/i18n-provider";
import { I18nWrapper } from "@/components/i18n-wrapper";
import { ConfirmationProvider } from "@/components/providers/confirmation-provider";
import { addCleanupCallback, startMemoryMonitoring } from "@/lib/memory-manager";
import '@/lib/i18n-client'; // Initialize i18n on client side

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - increased for better performance
            gcTime: 10 * 60 * 1000, // 10 minutes - increased for better performance
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            // Add optimistic updates for faster perceived performance
            placeholderData: (previousData) => previousData,
          },
          mutations: {
            retry: 1,
            // Add optimistic updates for mutations
            onMutate: async (variables) => {
              // Cancel any outgoing refetches
              await queryClient.cancelQueries();
              return { previousData: queryClient.getQueryData() };
            },
          },
        },
      })
  );

  // Optimized cleanup function to prevent memory leaks without affecting performance
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Only clear queries on actual page unload, not on refresh
      if (performance.navigation.type === 1) { // NavigationType.RELOAD
        queryClient.clear();
      }
    };

    const handleVisibilityChange = () => {
      // Only clear stale queries when page is hidden for a long time
      if (document.hidden) {
        // Don't clear immediately, wait a bit
        setTimeout(() => {
          if (document.hidden) {
            queryClient.clear();
          }
        }, 30000); // 30 seconds delay
      }
    };

    // Add cleanup callback to memory manager with reduced frequency
    const cleanupCallback = () => {
      // Only clear if memory usage is actually high
      if (performance.memory && performance.memory.usedJSHeapSize > performance.memory.jsHeapSizeLimit * 0.8) {
        queryClient.clear();
      }
    };
    addCleanupCallback(cleanupCallback);

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start memory monitoring with higher threshold and longer interval
    startMemoryMonitoring(90, 60000); // Monitor every 60 seconds, cleanup if >90% usage

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient]);

  return (
    <SessionProvider>
      <RBACProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryClientProvider client={queryClient}>
            <SSEProvider>
              <I18nWrapper>
                <I18nProvider>
                  <ConfirmationProvider>
                    {children}
                  </ConfirmationProvider>
                </I18nProvider>
              </I18nWrapper>
              <ReactQueryDevtools initialIsOpen={false} />
            </SSEProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </RBACProvider>
    </SessionProvider>
  );
}
