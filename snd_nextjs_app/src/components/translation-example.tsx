'use client';

import { useI18n } from '@/hooks/use-i18n';
import { LanguageSwitcher } from './language-switcher';

export function TranslationExample() {
  const { t, currentLanguage, isRTL, direction } = useI18n();

  return (
    <div className="p-6 space-y-4" dir={direction}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {t('welcome.title')}
        </h1>
        <LanguageSwitcher />
      </div>

      <div className="space-y-2">
        <p>{t('welcome.message')}</p>
        <p>{t('common.currentLanguage')}: {currentLanguage}</p>
        <p>{t('common.direction')}: {direction}</p>
        <p>{t('common.isRTL')}: {isRTL ? 'Yes' : 'No'}</p>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold mb-2">
          {t('examples.title')}
        </h2>
        <ul className="space-y-1">
          <li>{t('examples.simple')}</li>
          <li>{t('examples.withParams', { name: 'John' })}</li>
          <li>{t('examples.namespace.key')}</li>
        </ul>
      </div>
    </div>
  );
}
