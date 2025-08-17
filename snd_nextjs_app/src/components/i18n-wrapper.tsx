'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from 'next-auth/react';

interface I18nWrapperProps {
  children: React.ReactNode;
}

export function I18nWrapper({ children }: I18nWrapperProps) {
  const { i18n } = useTranslation();
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
  }, [status, session?.user?.id, i18n]);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  // Always render children, let the i18n system handle its own initialization
  return <>{children}</>;
} 