// Dashboard Section Permissions Configuration
// This file defines which permissions are required to view each dashboard section
// Fully database-driven - no hardcoded permissions or role arrays

import { Action, Subject } from './custom-rbac';

export interface DashboardSectionPermission {
  section: string;
  action: Action;
  subject: Subject;
  description: string;
  // Optional: Support multiple permissions for a section
  additionalPermissions?: Array<{
    action: Action;
    subject: Subject;
  }>;
}

export const dashboardSectionPermissions: DashboardSectionPermission[] = [
  {
    section: 'manualAssignments',
    action: 'read',
    subject: 'Employee',
    description: 'View and manage manual employee assignments',
    additionalPermissions: [
      {
        action: 'read',
        subject: 'Assignment'
      }
    ]
  },
  {
    section: 'iqama',
    action: 'manage',
    subject: 'Iqama',
    description: 'Manage employee Iqama (residence permit) operations including renewal, expiry tracking, and approvals'
  },
  {
    section: 'equipment',
    action: 'read',
    subject: 'Equipment',
    description: 'View equipment status and maintenance information'
  },
  {
    section: 'financial',
    action: 'read',
    subject: 'Payroll',
    description: 'View financial overview and payroll information'
  },
  {
    section: 'timesheets',
    action: 'read',
    subject: 'Timesheet',
    description: 'View and manage employee timesheets'
  },
  {
    section: 'projectOverview',
    action: 'read',
    subject: 'Project',
    description: 'View project overview and status'
  },
  {
    section: 'quickActions',
    action: 'read',
    subject: 'Settings',
    description: 'Access quick action buttons and shortcuts'
  },
  {
    section: 'recentActivity',
    action: 'read',
    subject: 'Settings',
    description: 'View recent system activities and logs'
  },
  {
    section: 'employeeAdvance',
    action: 'read',
    subject: 'Advance',
    description: 'View and manage employee advance payments and repayments'
  },
  {
    section: 'sectionControls',
    action: 'read',
    subject: 'Settings',
    description: 'Control dashboard section visibility'
  },
  {
    section: 'exportReports',
    action: 'export',
    subject: 'Report',
    description: 'Export dashboard reports and data'
  },
  {
    section: 'myTeam',
    action: 'read',
    subject: 'Employee',
    description: 'View and manage team members and subordinates'
  }
];

// Helper function to get permission for a specific section
export function getSectionPermission(section: string): DashboardSectionPermission | undefined {
  return dashboardSectionPermissions.find(perm => perm.section === section);
}

// Client-side permission check - uses API calls instead of direct database access
export async function hasSectionPermission(
  userId: string,
  section: string
): Promise<boolean> {
  const permission = getSectionPermission(section);
  if (!permission) return false;
  
  try {
    // Use client-side permission checking
    const { checkUserPermissionClient } = await import('./client-permission-service');
    
    // Check primary permission
    const primaryResult = await checkUserPermissionClient(userId, permission.action, permission.subject);
    if (!primaryResult.hasPermission) {
      return false;
    }
    
    // Check additional permissions if they exist
    if (permission.additionalPermissions && permission.additionalPermissions.length > 0) {
      for (const additionalPerm of permission.additionalPermissions) {
        const additionalResult = await checkUserPermissionClient(userId, additionalPerm.action, additionalPerm.subject);
        if (!additionalResult.hasPermission) {
          return false;
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Error checking section permission for ${section}:`, error);
    return false; // No fallback - if API fails, deny access
  }
}

// Database-driven function to get all sections user can access
export async function getUserAccessibleSections(userId: string): Promise<string[]> {
  const accessibleSections: string[] = [];
  
  for (const permission of dashboardSectionPermissions) {
    try {
      const hasAccess = await hasSectionPermission(userId, permission.section);
      if (hasAccess) {
        accessibleSections.push(permission.section);
      }
    } catch (error) {
      console.error(`Error checking access for section ${permission.section}:`, error);
      // Continue checking other sections even if one fails
    }
  }
  
  return accessibleSections;
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
