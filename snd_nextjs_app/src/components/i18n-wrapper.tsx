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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      const loadUserLanguage = async () => {
        try {
          const response = await fetch('/api/user/language');
          if (response.ok) {
            const data = await response.json();
            if (data.language) {
              i18n.changeLanguage(data.language);
            }
          }
        } catch (error) {
          console.error('Failed to load user language preference:', error);
        }
      };

      loadUserLanguage();
    }

    // Set ready state when translations are loaded
    if (i18n.isInitialized) {
      setIsReady(true);
    }
  }, [status, session?.user?.id, i18n]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading translations...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 