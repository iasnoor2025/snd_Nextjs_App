import { Action, Subject } from './custom-rbac';

export interface PermissionCheck {
  hasPermission: boolean;
  reason?: string;
  userRole?: string;
  requiredPermissions?: string[];
}

/**
 * Client-side permission checking using API calls
 * This version is safe to use in the browser
 */
export async function checkUserPermissionClient(
  userId: string,
  action: Action,
  subject: Subject
): Promise<PermissionCheck> {
  try {
    const response = await fetch('/api/permissions/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        action,
        subject,
      }),
    });

    if (!response.ok) {
      console.error('Permission check failed:', response.statusText);
      return { hasPermission: false, reason: 'Permission check failed' };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error checking permission:', error);
    return { hasPermission: false, reason: 'Network error' };
  }
}

/**
 * Get all accessible sections for a user via API
 */
export async function getUserAccessibleSectionsClient(userId: string): Promise<string[]> {
  try {
    const response = await fetch(`/api/permissions/sections/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to get accessible sections:', response.statusText);
      return [];
    }

    const result = await response.json();
    return result.sections || [];
  } catch (error) {
    console.error('Error getting accessible sections:', error);
    return [];
  }
}

/**
 * Check if user has permission for a specific section
 */
export async function hasSectionPermissionClient(
  userId: string,
  section: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/permissions/section', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        section,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.hasPermission || false;
  } catch (error) {
    console.error('Error checking section permission:', error);
    return false;
  }
}
