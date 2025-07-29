'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { useTranslation } from 'react-i18next';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function HomePage() {
  const { t } = useTranslation(['common']);
  const { data: session, status } = useSession();

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="h-full w-full bg-background">
        <div className="w-full p-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4">
              {t('app.name')}
            </h1>
            <p className="text-muted-foreground mb-8">
              Welcome back, {session?.user?.name || "User"}! {t('app.welcome')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-2">{t('navigation.dashboard')}</h2>
              <p className="text-muted-foreground">
                View your rental analytics and performance metrics
              </p>
            </div>

            <div className="bg-card border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-2">{t('navigation.customers')}</h2>
              <p className="text-muted-foreground">
                Manage customer information and relationships
              </p>
            </div>

            <div className="bg-card border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-2">{t('navigation.equipment')}</h2>
              <p className="text-muted-foreground">
                Track and manage rental equipment inventory
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/modules/employee-management"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Go to Employee Management
            </Link>
          </div>

          <div className="mt-8 p-4 bg-secondary rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Layout Test</h3>
            <p className="text-secondary-foreground">
              If you can see this content properly positioned to the right of the sidebar,
              the layout is working correctly. The content should not be hidden under the sidebar.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
