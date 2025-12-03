import type { Locale } from '@/lib/i18n-config';

// Import all translation files
import enCommon from '@/dictionaries/en/common.json';
import enAuth from '@/dictionaries/en/auth.json';
import enDashboard from '@/dictionaries/en/dashboard.json';
import enEquipment from '@/dictionaries/en/equipment.json';
import enEmployee from '@/dictionaries/en/employee.json';
import enRental from '@/dictionaries/en/rental.json';
import enReporting from '@/dictionaries/en/reporting.json';
import enProject from '@/dictionaries/en/project.json';
import enQuotation from '@/dictionaries/en/quotation.json';
import enPayroll from '@/dictionaries/en/payroll.json';
import enCustomer from '@/dictionaries/en/customer.json';
import enCompany from '@/dictionaries/en/company.json';
import enLeave from '@/dictionaries/en/leave.json';
import enSafety from '@/dictionaries/en/safety.json';
import enLocation from '@/dictionaries/en/location.json';
import enUser from '@/dictionaries/en/user.json';
import enProfile from '@/dictionaries/en/profile.json';
import enNotifications from '@/dictionaries/en/notifications.json';
import enAdmin from '@/dictionaries/en/admin.json';
import enSidebar from '@/dictionaries/en/sidebar.json';
import enTimesheet from '@/dictionaries/en/timesheet.json';
import enFinancial from '@/dictionaries/en/financial.json';
import enMaintenance from '@/dictionaries/en/maintenance.json';
import enAssignment from '@/dictionaries/en/assignment.json';
import enCountries from '@/dictionaries/en/countries.json';
import enLocations from '@/dictionaries/en/locations.json';
import enDepartments from '@/dictionaries/en/departments.json';
import enDesignations from '@/dictionaries/en/designations.json';
import enRoles from '@/dictionaries/en/roles.json';
import enProjectTemplates from '@/dictionaries/en/project-templates.json';
import enTranslate from '@/dictionaries/en/translate.json';

import arCommon from '@/dictionaries/ar/common.json';
import arAuth from '@/dictionaries/ar/auth.json';
import arDashboard from '@/dictionaries/ar/dashboard.json';
import arEquipment from '@/dictionaries/ar/equipment.json';
import arEmployee from '@/dictionaries/ar/employee.json';
import arRental from '@/dictionaries/ar/rental.json';
import arReporting from '@/dictionaries/ar/reporting.json';
import arProject from '@/dictionaries/ar/project.json';
import arQuotation from '@/dictionaries/ar/quotation.json';
import arPayroll from '@/dictionaries/ar/payroll.json';
import arCustomer from '@/dictionaries/ar/customer.json';
import arCompany from '@/dictionaries/ar/company.json';
import arLeave from '@/dictionaries/ar/leave.json';
import arSafety from '@/dictionaries/ar/safety.json';
import arLocation from '@/dictionaries/ar/location.json';
import arUser from '@/dictionaries/ar/user.json';
import arProfile from '@/dictionaries/ar/profile.json';
import arNotifications from '@/dictionaries/ar/notifications.json';
import arAdmin from '@/dictionaries/ar/admin.json';
import arSidebar from '@/dictionaries/ar/sidebar.json';
import arTimesheet from '@/dictionaries/ar/timesheet.json';
import arFinancial from '@/dictionaries/ar/financial.json';
import arMaintenance from '@/dictionaries/ar/maintenance.json';
import arAssignment from '@/dictionaries/ar/assignment.json';
import arCountries from '@/dictionaries/ar/countries.json';
import arLocations from '@/dictionaries/ar/locations.json';
import arDepartments from '@/dictionaries/ar/departments.json';
import arDesignations from '@/dictionaries/ar/designations.json';
import arRoles from '@/dictionaries/ar/roles.json';
import arProjectTemplates from '@/dictionaries/ar/project-templates.json';
import arTranslate from '@/dictionaries/ar/translate.json';

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
