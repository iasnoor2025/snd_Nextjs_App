import { ConditionalLayout } from '@/components/conditional-layout';
import { Providers } from '@/components/providers';
import { RBACInitializer } from '@/components/rbac-initializer';
import { Toaster } from '@/components/ui/sonner';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'SND Rental Management System',
  description: 'Comprehensive rental management system for equipment and property rentals',
  keywords: ['rental', 'management', 'equipment', 'property', 'business'],
  authors: [{ name: 'SND Development Team' }],
  robots: 'index, follow',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning className={inter.variable}>
      <body className="font-sans antialiased">
        <Providers>
          <RBACInitializer />
          <ConditionalLayout>{children}</ConditionalLayout>
          <Toaster position="top-right" richColors closeButton duration={4000} />
        </Providers>
      </body>
    </html>
  );
}
