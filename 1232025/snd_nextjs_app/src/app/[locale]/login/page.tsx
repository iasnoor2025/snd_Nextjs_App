'use client';

import { LoginForm } from '@/components/login-form';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import Image from 'next/image';

export default function LoginPage() {
  // Hooks must be called unconditionally - never wrap in try-catch
  const { t } = useI18n();
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session) {
      // Get locale from params or default to 'en'
      const locale = (params?.locale as string) || 'en';
      // Redirect to locale-prefixed home page
      window.location.href = `/${locale}`;
    }
  }, [session, status, params]);

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
        <a href="/" className="flex items-center gap-3 self-center font-medium">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background">
            <Image
              src="/snd-logo.png"
              alt={t('auth.app_name')}
              width={36}
              height={36}
              className="h-8 w-8 object-contain"
              priority
            />
          </div>
          <span className="text-lg font-semibold tracking-tight">{t('auth.app_name')}</span>
        </a>
        
        <LoginForm />
      </div>
    </div>
  );
}