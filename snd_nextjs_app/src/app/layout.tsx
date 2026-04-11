import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// Force dynamic rendering to prevent SSR issues with authentication
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    default: 'SND Rental Management System',
    template: '%s | SND Rental',
  },
  description: 'Comprehensive rental management system for equipment and property rentals',
  keywords: ['rental', 'management', 'equipment', 'property', 'Saudi Arabia'],
  openGraph: {
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

import ErrorBoundary from '@/components/error-boundary';
import { ChunkErrorListeners } from '@/components/chunk-error-listeners';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={inter.variable}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
      </head>
      <body className="font-sans antialiased touch-pan-y" suppressHydrationWarning>
        <ChunkErrorListeners />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 rtl:focus:left-auto rtl:focus:right-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Skip to main content
        </a>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
