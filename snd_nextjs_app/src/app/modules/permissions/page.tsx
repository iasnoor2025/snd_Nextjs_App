'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { PermissionManagement } from '@/components/permission-management';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { Shield, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface Permission {
  id: number;
  name: string;
  guardName?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Role {
  id: number;
  name: string;
  guardName: string;
  createdAt: string;
  updatedAt: string;
  userCount?: number;
}

export default function PermissionsPage() {
  const { getAllowedActions } = useRBAC();
  const { t } = useTranslation();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get allowed actions for permission management
  const allowedActions = getAllowedActions('Permission');

  // Fetch all permissions
  const fetchPermissions = async () => {
    try {
      setLoadingPermissions(true);
      const response = await fetch('/api/permissions?limit=all');
      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }
      const data = await response.json();
      
      let permissionsArray = [];
      if (data && typeof data === 'object' && Array.isArray(data.permissions)) {
        permissionsArray = data.permissions;
      } else if (Array.isArray(data)) {
        permissionsArray = data;
      }
      
      setPermissions(permissionsArray);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions([]);
      throw error;
    } finally {
      setLoadingPermissions(false);
    }
  };

  // Fetch roles
  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }
      const rolesData = await response.json();
      
      let rolesArray = [];
      if (Array.isArray(rolesData)) {
        rolesArray = rolesData;
      }
      
      setRoles(rolesArray);
    } catch (error) {
      console.error('Error in fetchRoles:', error);
      setRoles([]);
      throw error;
    }
  };

  // Update role permissions
  const updateRolePermissions = async (permissionIds: number[]) => {
    if (!selectedRole) return;

    try {
      const response = await fetch(`/api/roles/${selectedRole.id}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissionIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role permissions');
      }

      const result = await response.json();
      toast.success('Role permissions updated successfully');
      
      // Reset selection
      setSelectedRole(null);
      setSelectedPermissions([]);
    } catch (error) {
      console.error('Error updating role permissions:', error);
      toast.error('Failed to update role permissions');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        await Promise.all([fetchPermissions(), fetchRoles()]);
      } catch (err) {
        console.error('Error loading permissions data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <ProtectedRoute requiredPermission={{ action: 'manage', subject: 'Permission' }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t('permissions:messages.loading')}</div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredPermission={{ action: 'manage', subject: 'Permission' }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">
            Error: {error}
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ action: 'manage', subject: 'Permission' }}>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              {t('permissions:title')}
            </h1>
            <p className="text-muted-foreground">
              {t('permissions:subtitle')}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="text-sm text-muted-foreground">
              {t('permissions:stats.permissionsCount', { count: permissions.length })} • {t('permissions:stats.rolesCount', { count: roles.length })}
            </div>
          </div>
        </div>

        {/* Permission Management Component */}
        <PermissionManagement
          permissions={permissions}
          roles={roles}
          selectedRole={selectedRole}
          selectedPermissions={selectedPermissions}
          onPermissionChange={setSelectedPermissions}
          onRoleChange={setSelectedRole}
          loading={loadingPermissions}
        />
        
        {/* Save Permissions Button */}
        {selectedRole && (
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {t('permissions:actions.saveChanges')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('permissions:messages.saveChangesFor', { role: selectedRole.name })}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 text-sm border rounded-md hover:bg-muted"
                  onClick={() => {
                    setSelectedRole(null);
                    setSelectedPermissions([]);
                  }}
                >
                  {t('permissions:actions.cancel')}
                </button>
                <button
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                  onClick={() => {
                    const permissionIds = selectedPermissions.map(p => p.id);
                    updateRolePermissions(permissionIds);
                  }}
                  disabled={loadingPermissions}
                >
                  {t('permissions:actions.savePermissions')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
