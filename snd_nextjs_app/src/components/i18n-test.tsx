'use client';

import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/use-i18n';

export function I18nTest() {
  const { t } = useTranslation(['common']);
  const { currentLanguage, isRTL, changeLanguage } = useI18n();

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-4">i18n Test Component</h2>
      
      <div className="space-y-2">
        <p><strong>Current Language:</strong> {currentLanguage}</p>
        <p><strong>Is RTL:</strong> {isRTL ? 'Yes' : 'No'}</p>
        <p><strong>Translation Test:</strong> {t('app.name')}</p>
        
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => changeLanguage('en')}
            className="px-3 py-1 bg-blue-500 text-white rounded"
          >
            Switch to English
          </button>
          <button
            onClick={() => changeLanguage('ar')}
            className="px-3 py-1 bg-green-500 text-white rounded"
          >
            Switch to Arabic
          </button>
        </div>
      </div>
    </div>
  );
} 