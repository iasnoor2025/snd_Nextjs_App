"use client";
import MaintenanceHistoryTable from '@/components/equipment/MaintenanceHistoryTable';
import { useTranslation } from 'react-i18next';

export default function MaintenanceManagementPage() {
  const { t } = useTranslation('maintenance');
  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{t('page.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('page.subtitle')}</p>
      </div>
      <MaintenanceHistoryTable />
    </div>
  );
}


