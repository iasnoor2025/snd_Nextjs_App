'use client';

import i18n from '@/lib/i18n-client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';

interface I18nWrapperProps {
  children: React.ReactNode;
}

export function I18nWrapper({ children }: I18nWrapperProps) {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      const loadUserLanguage = async () => {
        try {
          const response = await fetch('/api/user/language');
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.language) {
              i18n.changeLanguage(data.language);
            }
          } else {
            console.warn('Failed to load user language preference, using default');
          }
        } catch (error) {
          console.warn('Failed to load user language preference, using default:', error);
        }
      };

      loadUserLanguage();
    }
  }, [status, session?.user?.id]);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  // Wrap children with I18nextProvider to ensure i18n context is available
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
