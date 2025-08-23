import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// Import all translation files
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
import enMaintenance from '@/locales/en/maintenance.json';
import enSkills from '@/locales/en/skills.json';
import enTraining from '@/locales/en/training.json';
import enPerformanceReviews from '@/locales/en/performance-reviews.json';
import enAuditCompliance from '@/locales/en/audit-compliance.json';
import enCountries from '@/locales/en/countries.json';
import enLocations from '@/locales/en/locations.json';
import enDepartments from '@/locales/en/departments.json';
import enDesignations from '@/locales/en/designations.json';
import enRoles from '@/locales/en/roles.json';
import enProjectTemplates from '@/locales/en/project-templates.json';
import enTranslate from '@/locales/en/translate.json';

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
import arMaintenance from '@/locales/ar/maintenance.json';
import arSkills from '@/locales/ar/skills.json';
import arTraining from '@/locales/ar/training.json';
import arPerformanceReviews from '@/locales/ar/performance-reviews.json';
import arAuditCompliance from '@/locales/ar/audit-compliance.json';
import arCountries from '@/locales/ar/countries.json';
import arLocations from '@/locales/ar/locations.json';
import arDepartments from '@/locales/ar/departments.json';
import arDesignations from '@/locales/ar/designations.json';
import arRoles from '@/locales/ar/roles.json';
import arProjectTemplates from '@/locales/ar/project-templates.json';
import arTranslate from '@/locales/ar/translate.json';

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
    skills: enSkills,
    training: enTraining,
    performanceReviews: enPerformanceReviews,
    auditCompliance: enAuditCompliance,
    countries: enCountries,
    locations: enLocations,
    departments: enDepartments,
    designations: enDesignations,
    roles: enRoles,
    projectTemplates: enProjectTemplates,
    translate: enTranslate,
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
    skills: arSkills,
    training: arTraining,
    performanceReviews: arPerformanceReviews,
    auditCompliance: arAuditCompliance,
    countries: arCountries,
    locations: arLocations,
    departments: arDepartments,
    designations: arDesignations,
    roles: arRoles,
    projectTemplates: arProjectTemplates,
    translate: arTranslate,
  },
};

// Browser-only initialization function
export const initializeI18n = () => {
  if (typeof window === 'undefined') {
    console.warn('i18n initialization called on server side');
    return Promise.resolve();
  }

  if (i18n.isInitialized) {
    return Promise.resolve();
  }

  try {
    // Get the saved language from storage
    const savedLanguage = localStorage.getItem('i18nextLng') || sessionStorage.getItem('i18nextLng') || 'en';

    return i18n
      .use(initReactI18next)
      .init({
        resources,
        fallbackLng: 'en',
        lng: savedLanguage, // Force the initial language to the saved one
        debug: process.env.NODE_ENV === 'development',

        interpolation: {
          escapeValue: false, // React already escapes values
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
          'skills',
          'training',
          'performanceReviews',
          'auditCompliance',
          'countries',
          'locations',
          'departments',
          'designations',
          'roles',
          'projectTemplates',
          'translate',
        ],

        react: {
          useSuspense: false,
        },
      })
      .then(() => {
        // Verify the language is set correctly
        if (i18n.language !== savedLanguage && ['en', 'ar'].includes(savedLanguage)) {
          i18n.changeLanguage(savedLanguage);
        }
      })
      .catch((error: unknown) => {
        console.error('i18n initialization error:', error);
        // Initialize with minimal fallback configuration
        return i18n.init({
          resources: { en: { common: {} }, ar: { common: {} } },
          fallbackLng: 'en',
          lng: 'en',
          debug: false,
          react: { useSuspense: false },
        });
      });
  } catch (error) {
    console.error('Error in initializeI18n:', error);
    // Return a resolved promise even on error to prevent crashes
    return Promise.resolve();
  }
};

export default i18n;
