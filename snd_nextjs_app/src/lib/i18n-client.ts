'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from '@/locales/en/common.json';
import enAuth from '@/locales/en/auth.json';
import enDashboard from '@/locales/en/dashboard.json';
import enEquipment from '@/locales/en/equipment.json';
import enEmployee from '@/locales/en/employee.json';
import enRental from '@/locales/en/rental.json';
import enSettings from '@/locales/en/settings.json';
import enReporting from '@/locales/en/reporting.json';
import enAnalytics from '@/locales/en/analytics.json';
import enSidebar from '@/locales/en/sidebar.json';

import arCommon from '@/locales/ar/common.json';
import arAuth from '@/locales/ar/auth.json';
import arDashboard from '@/locales/ar/dashboard.json';
import arEquipment from '@/locales/ar/equipment.json';
import arEmployee from '@/locales/ar/employee.json';
import arRental from '@/locales/ar/rental.json';
import arSettings from '@/locales/ar/settings.json';
import arReporting from '@/locales/ar/reporting.json';
import arAnalytics from '@/locales/ar/analytics.json';
import arSidebar from '@/locales/ar/sidebar.json';

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    equipment: enEquipment,
    employee: enEmployee,
    rental: enRental,
    settings: enSettings,
    reporting: enReporting,
    analytics: enAnalytics,
    sidebar: enSidebar,
  },
  ar: {
    common: arCommon,
    auth: arAuth,
    dashboard: arDashboard,
    equipment: arEquipment,
    employee: arEmployee,
    rental: arRental,
    settings: arSettings,
    reporting: arReporting,
    analytics: arAnalytics,
    sidebar: arSidebar,
  },
};

// Only initialize if not already initialized
if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'en',
      debug: process.env.NODE_ENV === 'development',

      interpolation: {
        escapeValue: false, // React already escapes values
      },

      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
      },

      defaultNS: 'common',
      ns: ['common', 'auth', 'dashboard', 'equipment', 'employee', 'rental', 'settings', 'reporting', 'analytics', 'sidebar'],

      react: {
        useSuspense: false,
      },
    })
    .then(() => {
      console.log('i18n initialized successfully');
    })
    .catch((error) => {
      console.error('i18n initialization error:', error);
    });
}

export default i18n; 