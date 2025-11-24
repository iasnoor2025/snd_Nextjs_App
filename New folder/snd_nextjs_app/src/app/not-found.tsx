'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useI18n } from '@/hooks/use-i18n';

export default function NotFound() {
  const { t } = useI18n();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
          <div className="space-x-4">
            <Button asChild>
              <Link href="/">{t('common.pages.notFound.goHome')}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">{t('common.pages.notFound.dashboard')}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
