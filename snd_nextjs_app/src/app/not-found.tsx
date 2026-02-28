'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useI18n } from '@/hooks/use-i18n';
import { usePathname } from 'next/navigation';
import { validateLocale } from '@/lib/locale-utils';

export default function NotFound() {
  const { t } = useI18n();
  const pathname = usePathname();
  const pathParts = pathname?.split('/').filter(Boolean) || [];
  const locale = pathParts[0] && validateLocale(pathParts[0]) ? pathParts[0] : 'en';
  const homeHref = `/${locale}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-6xl font-bold text-gray-400">{t('common.pages.notFound.title')}</CardTitle>
          <CardDescription className="text-xl font-semibold text-gray-600">
            {t('common.pages.notFound.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-500">
            {t('common.pages.notFound.description')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild>
              <Link href={homeHref}>{t('common.pages.notFound.goHome')}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={homeHref}>{t('common.pages.notFound.dashboard')}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
