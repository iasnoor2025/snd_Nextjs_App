'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';


import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useI18n } from '@/hooks/use-i18n';

function AccessDeniedContent() {
  const searchParams = useSearchParams();
  const requiredRole = searchParams.get('requiredRole');
  const currentRole = searchParams.get('currentRole');
  const { t } = useI18n();

  const requiredRoles = requiredRole ? requiredRole.split(',') : [];
  const currentUserRole = currentRole || 'Unknown';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-800">{t('common.rbac.accessDenied')}</CardTitle>
            <CardDescription className="text-red-600">
              {t('common.rbac.accessDeniedMessage')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="font-medium">{t('common.rbac.requiredRoles')}:</span>
              </div>
              <div className="ml-6">
                {requiredRoles.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {requiredRoles.map((role, index) => (
                      <li key={index} className="capitalize">
                        {role.toLowerCase().replace('_', ' ')}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">{t('common.rbac.noSpecificRoleRequirements')}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="font-medium">{t('common.rbac.yourCurrentRole')}:</span>
              </div>
              <div className="ml-6">
                <p className="text-sm text-gray-700 capitalize">
                  {currentUserRole.toLowerCase().replace('_', ' ')}
                </p>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <Link href="/">
                <Button variant="outline" className="w-full">
                  {t('common.rbac.goHome')}
                </Button>
              </Link>

              <Button asChild className="w-full" variant="default">
                <Link href="/profile">{t('common.rbac.viewProfile')}</Link>
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center pt-4">
              {t('common.rbac.contactAdministrator')}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AccessDeniedPage() {
  const { t } = useI18n();
  
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto p-6">
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl text-red-800">{t('common.rbac.loading')}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    }>
      <AccessDeniedContent />
    </Suspense>
  );
}
