import { i18n } from '@/lib/i18n-config';
import { validateLocale } from '@/lib/locale-utils';
import { Providers } from '@/components/providers';
import { ConditionalLayout } from '@/components/conditional-layout';
import { RBACInitializer } from '@/components/rbac-initializer';
import { Toaster } from '@/components/ui/sonner';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';

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

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Ensure locale is valid, fallback to 'en' if not
  const validLocale = validateLocale(locale);
  const isRTL = validLocale === 'ar';
  
  return (
    <div 
      lang={validLocale} 
      dir={isRTL ? 'rtl' : 'ltr'} 
      className={`${inter.variable} ${isRTL ? 'rtl' : ''}`}
    >
      <Providers>
        <RBACInitializer />
        <ConditionalLayout>{children}</ConditionalLayout>
        <Toaster position="top-right" richColors closeButton duration={4000} />
      </Providers>
    </div>
  );
}
