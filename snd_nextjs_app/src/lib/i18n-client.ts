'use client';

import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enAdmin from '@/locales/en/admin.json';
import enAnalytics from '@/locales/en/analytics.json';
import enAuth from '@/locales/en/auth.json';
import enCommon from '@/locales/en/common.json';
import enCompany from '@/locales/en/company.json';
import enCustomer from '@/locales/en/customer.json';
import enDashboard from '@/locales/en/dashboard.json';
import enEmployee from '@/locales/en/employee.json';
import enEquipment from '@/locales/en/equipment.json';
import enFinancial from '@/locales/en/financial.json';
import enLeave from '@/locales/en/leave.json';
import enLocation from '@/locales/en/location.json';
import enMaintenance from '@/locales/en/maintenance.json';
import enNotifications from '@/locales/en/notifications.json';
import enPayroll from '@/locales/en/payroll.json';
import enProfile from '@/locales/en/profile.json';
import enProject from '@/locales/en/project.json';
import enQuotation from '@/locales/en/quotation.json';
import enRental from '@/locales/en/rental.json';
import enReporting from '@/locales/en/reporting.json';
import enSafety from '@/locales/en/safety.json';
import enSettings from '@/locales/en/settings.json';
import enSidebar from '@/locales/en/sidebar.json';
import enTimesheet from '@/locales/en/timesheet.json';
import enUser from '@/locales/en/user.json';

import arAdmin from '@/locales/ar/admin.json';
import arAnalytics from '@/locales/ar/analytics.json';
import arAuth from '@/locales/ar/auth.json';
import arCommon from '@/locales/ar/common.json';
import arCompany from '@/locales/ar/company.json';
import arCustomer from '@/locales/ar/customer.json';
import arDashboard from '@/locales/ar/dashboard.json';
import arEmployee from '@/locales/ar/employee.json';
import arEquipment from '@/locales/ar/equipment.json';
import arFinancial from '@/locales/ar/financial.json';
import arLeave from '@/locales/ar/leave.json';
import arLocation from '@/locales/ar/location.json';
import arMaintenance from '@/locales/ar/maintenance.json';
import arNotifications from '@/locales/ar/notifications.json';
import arPayroll from '@/locales/ar/payroll.json';
import arProfile from '@/locales/ar/profile.json';
import arProject from '@/locales/ar/project.json';
import arQuotation from '@/locales/ar/quotation.json';
import arRental from '@/locales/ar/rental.json';
import arReporting from '@/locales/ar/reporting.json';
import arSafety from '@/locales/ar/safety.json';
import arSettings from '@/locales/ar/settings.json';
import arSidebar from '@/locales/ar/sidebar.json';
import arTimesheet from '@/locales/ar/timesheet.json';
import arUser from '@/locales/ar/user.json';

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
    project: enProject,
    quotation: enQuotation,
    payroll: enPayroll,
    customer: enCustomer,
    company: enCompany,
    leave: enLeave,
    safety: enSafety,
    location: enLocation,
    user: enUser,
    profile: enProfile,
    notifications: enNotifications,
    admin: enAdmin,
    sidebar: enSidebar,
    timesheet: enTimesheet,
    financial: enFinancial,
    maintenance: enMaintenance,
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
    project: arProject,
    quotation: arQuotation,
    payroll: arPayroll,
    customer: arCustomer,
    company: arCompany,
    leave: arLeave,
    safety: arSafety,
    location: arLocation,
    user: arUser,
    profile: arProfile,
    notifications: arNotifications,
    admin: arAdmin,
    sidebar: arSidebar,
    timesheet: arTimesheet,
    financial: arFinancial,
    maintenance: arMaintenance,
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
      debug: false,

      interpolation: {
        escapeValue: false, // React already escapes values
      },

      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
      },

      defaultNS: 'common',
      ns: [
        'common',
        'auth',
        'dashboard',
        'equipment',
        'employee',
        'rental',
        'settings',
        'reporting',
        'analytics',
        'project',
        'quotation',
        'payroll',
        'customer',
        'company',
        'leave',
        'safety',
        'location',
        'user',
        'profile',
        'notifications',
        'admin',
        'sidebar',
        'timesheet',
        'financial',
        'maintenance',
      ],

      react: {
        useSuspense: false,
      },
    })
    .then(() => {
      console.log('✅ i18n initialized successfully');
    })
    .catch(error => {
      console.error('❌ i18n initialization error:', error);
    });
} else {
  console.log('🔄 i18n already initialized');
}

export default i18n;
