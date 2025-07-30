'use client';

import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/use-i18n';

export default function TestI18nPage() {
  const { t } = useTranslation(['common']);
  const { currentLanguage, isRTL, changeLanguage, languages } = useI18n();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">i18n Test Page</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="font-semibold mb-2">Current State</h2>
          <p><strong>Language:</strong> {currentLanguage}</p>
          <p><strong>Is RTL:</strong> {isRTL ? 'Yes' : 'No'}</p>
          <p><strong>Translation Test:</strong> {t('app.name', 'Translation not found')}</p>
        </div>

        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="font-semibold mb-2">Language Switcher</h2>
          <div className="flex gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`px-4 py-2 rounded ${
                  currentLanguage === lang.code
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {lang.flag} {lang.name}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h2 className="font-semibold mb-2">Document Attributes</h2>
          <p><strong>Document lang:</strong> {typeof document !== 'undefined' ? document.documentElement.lang : 'N/A'}</p>
          <p><strong>Document dir:</strong> {typeof document !== 'undefined' ? document.documentElement.dir : 'N/A'}</p>
          <p><strong>RTL class:</strong> {typeof document !== 'undefined' ? (document.documentElement.classList.contains('rtl') ? 'Yes' : 'No') : 'N/A'}</p>
        </div>
      </div>
    </div>
  );
} 