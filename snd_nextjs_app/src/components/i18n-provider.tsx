'use client';

import { useI18n } from '@/hooks/use-i18n';
import { useEffect, useState } from 'react';

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const { currentLanguage, isRTL } = useI18n();
  const [mounted, setMounted] = useState(false);

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update document attributes when language changes, but only after mount
  useEffect(() => {
    if (mounted) {
      try {
        document.documentElement.lang = currentLanguage;
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';

        if (isRTL) {
          document.documentElement.classList.add('rtl');
        } else {
          document.documentElement.classList.remove('rtl');
        }
      } catch (error) {
        console.error('Error setting document attributes:', error);
      }
    }
  }, [currentLanguage, isRTL, mounted]);

  return <>{children}</>;
}
