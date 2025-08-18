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
import enProject from '@/locales/en/project.json';
import enQuotation from '@/locales/en/quotation.json';
import enPayroll from '@/locales/en/payroll.json';
import enCustomer from '@/locales/en/customer.json';
import enCompany from '@/locales/en/company.json';
import enLeave from '@/locales/en/leave.json';
import enSafety from '@/locales/en/safety.json';
import enLocation from '@/locales/en/location.json';
import enUser from '@/locales/en/user.json';
import enProfile from '@/locales/en/profile.json';
import enNotifications from '@/locales/en/notifications.json';
import enAdmin from '@/locales/en/admin.json';
import enSidebar from '@/locales/en/sidebar.json';
import enTimesheet from '@/locales/en/timesheet.json';
import enFinancial from '@/locales/en/financial.json';
  
import arCommon from '@/locales/ar/common.json';
import arAuth from '@/locales/ar/auth.json';
import arDashboard from '@/locales/ar/dashboard.json';
import arEquipment from '@/locales/ar/equipment.json';
import arEmployee from '@/locales/ar/employee.json';
import arRental from '@/locales/ar/rental.json';
import arSettings from '@/locales/ar/settings.json';
import arReporting from '@/locales/ar/reporting.json';
import arAnalytics from '@/locales/ar/analytics.json';
import arProject from '@/locales/ar/project.json';
import arQuotation from '@/locales/ar/quotation.json';
import arPayroll from '@/locales/ar/payroll.json';
import arCustomer from '@/locales/ar/customer.json';
import arCompany from '@/locales/ar/company.json';
import arLeave from '@/locales/ar/leave.json';
import arSafety from '@/locales/ar/safety.json';
import arLocation from '@/locales/ar/location.json';
import arUser from '@/locales/ar/user.json';
import arProfile from '@/locales/ar/profile.json';
import arNotifications from '@/locales/ar/notifications.json';
import arAdmin from '@/locales/ar/admin.json';
import arSidebar from '@/locales/ar/sidebar.json';
import arTimesheet from '@/locales/ar/timesheet.json';
import arFinancial from '@/locales/ar/financial.json';

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
  },
};

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
    ns: ['common', 'auth', 'dashboard', 'equipment', 'employee', 'rental', 'settings', 'reporting', 'analytics', 'project', 'quotation', 'payroll', 'customer', 'company', 'leave', 'safety', 'location', 'user', 'profile', 'notifications', 'admin', 'sidebar', 'timesheet', 'financial'],

    react: {
      useSuspense: false,
    },
  })
  .then(() => {

  })
  .catch((error) => {
    console.error('i18n initialization error:', error);
  });

export default i18n;
