"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";
import { RBACProvider } from "@/lib/rbac/rbac-context";
import SSEProvider from "@/contexts/sse-context";
import { I18nProvider } from "@/components/i18n-provider";
import { I18nWrapper } from "@/components/i18n-wrapper";
import { ConfirmationProvider } from "@/components/providers/confirmation-provider";
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
          },
        },
      })
  );



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
