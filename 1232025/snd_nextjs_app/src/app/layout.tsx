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
  title: 'SND Rental Management System',
  description: 'SND Rental Management System',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
              
              // Handle chunk loading errors globally
              window.addEventListener('error', function(event) {
                if (event.message && (
                  event.message.includes('ChunkLoadError') ||
                  event.message.includes('Loading chunk') ||
                  event.message.includes('Failed to fetch dynamically imported module')
                )) {
                  console.warn('Chunk loading error detected, will retry on next navigation');
                  // Don't reload immediately, let the error boundary handle it
                }
              });
              
              // Handle unhandled promise rejections for chunk loading
              window.addEventListener('unhandledrejection', function(event) {
                if (event.reason && (
                  event.reason.message?.includes('ChunkLoadError') ||
                  event.reason.message?.includes('Loading chunk') ||
                  event.reason.message?.includes('Failed to fetch dynamically imported module')
                )) {
                  console.warn('Chunk loading promise rejection detected');
                  event.preventDefault(); // Prevent default error handling
                }
              });
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased touch-pan-y" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
