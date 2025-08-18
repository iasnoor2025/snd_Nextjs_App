'use client';

import { LoginForm } from '@/components/login-form';
import { GalleryVerticalEnd } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
// i18n refactor: All user-facing strings now use useTranslation('auth')
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const { t } = useTranslation('auth');
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (status === 'loading') return;

    if (session) {
      // Let the conditional layout handle the Nation ID check
      router.push('/dashboard');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (session) {
    return null; // Will redirect
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div>
          {t('app_name')}
        </a>
        <LoginForm />
      </div>
    </div>
  );
}
