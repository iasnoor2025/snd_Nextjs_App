// Dashboard Section Permissions Configuration
// This file defines which permissions are required to view each dashboard section

import { Action, Subject } from './custom-rbac';

export interface DashboardSectionPermission {
  section: string;
  action: Action;
  subject: Subject;
  description: string;
  requiredRole: string[];
}

export const dashboardSectionPermissions: DashboardSectionPermission[] = [
  {
    section: 'manualAssignments',
    action: 'read',
    subject: 'Employee',
    description: 'View and manage manual employee assignments',
    requiredRole: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR']
  },
  {
    section: 'iqama',
    action: 'read',
    subject: 'Employee',
    description: 'View employee Iqama (residence permit) information',
    requiredRole: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR']
  },
  {
    section: 'equipment',
    action: 'read',
    subject: 'Equipment',
    description: 'View equipment status and maintenance information',
    requiredRole: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR']
  },
  {
    section: 'financial',
    action: 'read',
    subject: 'Payroll',
    description: 'View financial overview and payroll information',
    requiredRole: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR']
  },
  {
    section: 'timesheets',
    action: 'read',
    subject: 'Timesheet',
    description: 'View and manage employee timesheets',
    requiredRole: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'EMPLOYEE']
  },
  {
    section: 'projectOverview',
    action: 'read',
    subject: 'Project',
    description: 'View project overview and status',
    requiredRole: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'EMPLOYEE']
  },
  {
    section: 'quickActions',
    action: 'read',
    subject: 'Settings',
    description: 'Access quick action buttons and shortcuts',
    requiredRole: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'EMPLOYEE']
  },
  {
    section: 'recentActivity',
    action: 'read',
    subject: 'Settings',
    description: 'View recent system activities and logs',
    requiredRole: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR']
  },
  {
    section: 'employeeAdvance',
    action: 'read',
    subject: 'AdvancePayment',
    description: 'View and manage employee advance payments and repayments',
    requiredRole: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR']
  },
  {
    section: 'sectionControls',
    action: 'read',
    subject: 'Settings',
    description: 'Control dashboard section visibility',
    requiredRole: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR']
  },
  {
    section: 'exportReports',
    action: 'export',
    subject: 'Report',
    description: 'Export dashboard reports and data',
    requiredRole: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR']
  }
];

// Helper function to get permission for a specific section
export function getSectionPermission(section: string): DashboardSectionPermission | undefined {
  return dashboardSectionPermissions.find(perm => perm.section === section);
}

// Helper function to check if user has permission for a section
export function hasSectionPermission(
  userRole: string,
  section: string
): boolean {
  const permission = getSectionPermission(section);
  if (!permission) return false;
  
  return permission.requiredRole.includes(userRole);
}

// Helper function to get all sections user can access
export function getUserAccessibleSections(userRole: string): string[] {
  return dashboardSectionPermissions
    .filter(perm => hasSectionPermission(userRole, perm.section))
    .map(perm => perm.section);
}

// Helper function to get permission object for a section
export function getPermissionForSection(section: string): { action: Action; subject: Subject } | null {
  const permission = getSectionPermission(section);
  if (!permission) return null;
  
  return {
    action: permission.action,
    subject: permission.subject
  };
}
