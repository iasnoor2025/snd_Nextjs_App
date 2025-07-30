'use client';

import { useTranslation } from 'react-i18next';

export function I18nDebug() {
  const { i18n, t } = useTranslation();

  return (
    <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
      <h3 className="font-semibold mb-2">i18n Debug Info</h3>
      <div className="text-sm space-y-1">
        <p><strong>i18n object:</strong> {i18n ? 'Available' : 'Not available'}</p>
        <p><strong>i18n.isInitialized:</strong> {i18n?.isInitialized ? 'Yes' : 'No'}</p>
        <p><strong>Current language:</strong> {i18n?.language || 'Unknown'}</p>
        <p><strong>Available languages:</strong> {i18n?.languages?.join(', ') || 'None'}</p>
        <p><strong>Translation test:</strong> {t('app.name', 'Translation not found')}</p>
        <p><strong>Document lang:</strong> {typeof document !== 'undefined' ? document.documentElement.lang : 'N/A'}</p>
        <p><strong>Document dir:</strong> {typeof document !== 'undefined' ? document.documentElement.dir : 'N/A'}</p>
      </div>
    </div>
  );
} 