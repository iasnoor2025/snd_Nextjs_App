"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { useState, useEffect } from "react";
import { RBACProvider } from "@/lib/rbac/rbac-context";
import { SSEProvider } from "@/contexts/sse-context";
import '@/lib/i18n'; // Initialize i18n

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

  useEffect(() => {
    // Set initial document direction based on language
    const savedLanguage = localStorage.getItem('i18nextLng') || 'en';
    if (savedLanguage === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    }
  }, []);

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
            <SSEProvider enabled={true} maxEvents={100} showToasts={true}>
              {children}
              <ReactQueryDevtools initialIsOpen={false} />
            </SSEProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </RBACProvider>
    </SessionProvider>
  );
}
