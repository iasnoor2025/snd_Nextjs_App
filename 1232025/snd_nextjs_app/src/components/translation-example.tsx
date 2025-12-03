'use client';

import { useTranslations } from '@/hooks/use-translations';
import { LanguageSwitcher } from './language-switcher';

export function TranslationExample() {
  const { t, locale, isRTL, direction } = useTranslations();

  return (
    <div className="p-6 space-y-4" dir={direction}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {t('dashboard.title')}
        </h1>
        <LanguageSwitcher />
      </div>

      <div className="space-y-2">
        <p>{t('common.currentLanguage')}: {locale}</p>
        <p>{t('common.direction')}: {direction}</p>
        <p>{t('common.isRTL')}: {isRTL ? 'Yes' : 'No'}</p>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold mb-2">
          {t('common.translationExamples')}
        </h2>
        <ul className="space-y-1">
          <li>{t('common.save')}</li>
          <li>{t('common.cancel')}</li>
          <li>{t('common.delete')}</li>
          <li>{t('common.edit')}</li>
          <li>{t('common.create')}</li>
        </ul>
      </div>

      <div className="bg-blue-100 p-4 rounded">
        <h2 className="font-semibold mb-2">
          {t('dashboard.sections.dashboard')}
        </h2>
        <ul className="space-y-1">
          <li>{t('dashboard.sections.employees')}</li>
          <li>{t('dashboard.sections.equipment')}</li>
          <li>{t('dashboard.sections.projects')}</li>
          <li>{t('dashboard.sections.reports')}</li>
        </ul>
      </div>
    </div>
  );
}
