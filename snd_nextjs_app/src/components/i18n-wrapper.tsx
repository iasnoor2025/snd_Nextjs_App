'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface I18nWrapperProps {
  children: React.ReactNode;
}

export function I18nWrapper({ children }: I18nWrapperProps) {
  const { i18n } = useTranslation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simple check for i18n availability
    if (i18n) {
      setIsReady(true);
    } else {
      // Wait a bit for i18n to be available
      const timer = setTimeout(() => setIsReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [i18n]);

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