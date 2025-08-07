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
            staleTime: 60 * 1000,
            retry: 1,
            gcTime: 5 * 60 * 1000, // 5 minutes garbage collection time
            refetchOnWindowFocus: false, // Prevent refetch on focus to reduce memory usage
            refetchOnReconnect: false, // Prevent refetch on reconnect to reduce memory usage
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear all queries on page unload
      queryClient.clear();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Clear stale queries when page is hidden
        queryClient.clear();
      }
    };

    // Add cleanup callback to memory manager
    const cleanupCallback = () => {
      queryClient.clear();
    };
    addCleanupCallback(cleanupCallback);

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start memory monitoring
    startMemoryMonitoring(80, 30000); // Monitor every 30 seconds, cleanup if >80% usage

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Clear queries on cleanup
      queryClient.clear();
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
