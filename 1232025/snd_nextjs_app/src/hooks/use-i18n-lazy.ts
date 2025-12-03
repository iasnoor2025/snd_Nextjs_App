import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { loadNamespace, loadNamespaces } from '@/lib/i18n-dynamic';

// Hook for lazy-loading translations
export function useI18nLazy() {
  const { t, i18n } = useTranslation();

  // Load a single namespace on demand
  const loadTranslation = useCallback(async (namespace: string) => {
    await loadNamespace(namespace, i18n.language);
  }, [i18n.language]);

  // Load multiple namespaces on demand
  const loadTranslations = useCallback(async (namespaces: string[]) => {
    await loadNamespaces(namespaces, i18n.language);
  }, [i18n.language]);

  // Pre-load translations for a page/component
  const preloadForPage = useCallback(async (page: string) => {
    const pageNamespaces = getNamespacesForPage(page);
    await loadTranslations(pageNamespaces);
  }, [loadTranslations]);

  return {
    t,
    loadTranslation,
    loadTranslations,
    preloadForPage,
    currentLanguage: i18n.language,
  };
}

// Define which namespaces each page needs
function getNamespacesForPage(page: string): string[] {
  const namespaceMap: Record<string, string[]> = {
    dashboard: ['dashboard', 'common', 'equipment', 'financial'],
    employee: ['employee', 'assignment', 'timesheet', 'common'],
    equipment: ['equipment', 'maintenance', 'common'],
    rental: ['rental', 'customer', 'equipment', 'common'],
    project: ['project', 'employee', 'equipment', 'common'],
    payroll: ['payroll', 'employee', 'financial', 'common'],
    customer: ['customer', 'company', 'common'],
    reporting: ['reporting', 'dashboard', 'common'],
    user: ['user', 'roles', 'admin', 'common'],
    settings: ['admin', 'user', 'common'],
  };

  return namespaceMap[page] || ['common'];
}

// Hook for component-specific translations
export function useComponentTranslations(namespaces: string[]) {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    // Load translations when component mounts
    loadNamespaces(namespaces, i18n.language);
  }, [namespaces, i18n.language]);

  return { t };
}
