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
import enCustomer from '@/locales/en/customer.json';
import enProfile from '@/locales/en/profile.json';
import enLeave from '@/locales/en/leave.json';
import enPayroll from '@/locales/en/payroll.json';
import enQuotation from '@/locales/en/quotation.json';
import enTimesheet from '@/locales/en/timesheet.json';
import enAdmin from '@/locales/en/admin.json';
import enCompany from '@/locales/en/company.json';
import enNotifications from '@/locales/en/notifications.json';
import enProject from '@/locales/en/project.json';
import enSafety from '@/locales/en/safety.json';
import enUser from '@/locales/en/user.json';
import enLocation from '@/locales/en/location.json';
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
import arCustomer from '@/locales/ar/customer.json';
import arProfile from '@/locales/ar/profile.json';
import arLeave from '@/locales/ar/leave.json';
import arPayroll from '@/locales/ar/payroll.json';
import arQuotation from '@/locales/ar/quotation.json';
import arTimesheet from '@/locales/ar/timesheet.json';
import arAdmin from '@/locales/ar/admin.json';
import arCompany from '@/locales/ar/company.json';
import arNotifications from '@/locales/ar/notifications.json';
import arProject from '@/locales/ar/project.json';
import arSafety from '@/locales/ar/safety.json';
import arUser from '@/locales/ar/user.json';
import arLocation from '@/locales/ar/location.json';
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
    customer: enCustomer,
    profile: enProfile,
    leave: enLeave,
    payroll: enPayroll,
    quotation: enQuotation,
    timesheet: enTimesheet,
    admin: enAdmin,
    company: enCompany,
    notifications: enNotifications,
    project: enProject,
    safety: enSafety,
    user: enUser,
    location: enLocation,
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
    customer: arCustomer,
    profile: arProfile,
    leave: arLeave,
    payroll: arPayroll,
    quotation: arQuotation,
    timesheet: arTimesheet,
    admin: arAdmin,
    company: arCompany,
    notifications: arNotifications,
    project: arProject,
    safety: arSafety,
    user: arUser,
    location: arLocation,
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
      ns: ['common', 'auth', 'dashboard', 'equipment', 'employee', 'customer', 'profile', 'leave', 'payroll', 'quotation', 'timesheet', 'admin', 'company', 'notifications', 'project', 'safety', 'user', 'location', 'rental', 'settings', 'reporting', 'analytics', 'sidebar'],

      react: {
        useSuspense: false,
      },
    })
    .then(() => {
  
    })
    .catch((error) => {
      console.error('i18n initialization error:', error);
    });
}

export default i18n; 