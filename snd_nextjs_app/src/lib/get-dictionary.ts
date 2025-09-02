import type { Locale } from '@/lib/i18n-config';

// Import all translation files
import enCommon from '@/locales/en/common.json';
import enAuth from '@/locales/en/auth.json';
import enDashboard from '@/locales/en/dashboard.json';
import enEquipment from '@/locales/en/equipment.json';
import enEmployee from '@/locales/en/employee.json';
import enRental from '@/locales/en/rental.json';
import enReporting from '@/locales/en/reporting.json';
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
import enAssignment from '@/locales/en/assignment.json';
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
import arReporting from '@/locales/ar/reporting.json';
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
import arAssignment from '@/locales/ar/assignment.json';
import arCountries from '@/locales/ar/countries.json';
import arLocations from '@/locales/ar/locations.json';
import arDepartments from '@/locales/ar/departments.json';
import arDesignations from '@/locales/ar/designations.json';
import arRoles from '@/locales/ar/roles.json';
import arProjectTemplates from '@/locales/ar/project-templates.json';
import arTranslate from '@/locales/ar/translate.json';

const dictionaries = {
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    equipment: enEquipment,
    employee: enEmployee,
    rental: enRental,
    reporting: enReporting,
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
    assignment: enAssignment,
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
    reporting: arReporting,
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
    assignment: arAssignment,
    countries: arCountries,
    locations: arLocations,
    departments: arDepartments,
    designations: arDesignations,
    roles: arRoles,
    projectTemplates: arProjectTemplates,
    translate: arTranslate,
  },
};

export const getDictionary = async (locale: Locale) => dictionaries[locale];
