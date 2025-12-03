'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, CheckCircle, Save, Shield } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  userCount: number;
}

const availablePermissions = [
  // User Management
  'users.read',
  'users.create',
  'users.update',
  'users.delete',

  // Role Management
  'roles.read',
  'roles.create',
  'roles.update',
  'roles.delete',

  // Equipment Management
  'equipment.read',
  'equipment.create',
  'equipment.update',
  'equipment.delete',

  // Rental Management
  'rentals.read',
  'rentals.create',
  'rentals.update',
  'rentals.delete',

  // Employee Management
  'employees.read',
  'employees.create',
  'employees.update',
  'employees.delete',

  // Project Management
  'projects.read',
  'projects.create',
  'projects.update',
  'projects.delete',

  // Iqama Management
  'iqama.read',
  'iqama.create',
  'iqama.update',
  'iqama.delete',

  // Reporting
  'reports.read',
  'reports.create',
  'reports.export',

  // Settings
  'settings.read',
  'settings.update',

  // Analytics
  'analytics.read',
  'analytics.export',
];

const permissionCategories = {
  'User Management': ['users.read', 'users.create', 'users.update', 'users.delete'],
  'Role Management': ['roles.read', 'roles.create', 'roles.update', 'roles.delete'],
  'Equipment Management': [
    'equipment.read',
    'equipment.create',
    'equipment.update',
    'equipment.delete',
  ],
  'Rental Management': ['rentals.read', 'rentals.create', 'rentals.update', 'rentals.delete'],
  'Employee Management': [
    'employees.read',
    'employees.create',
    'employees.update',
    'employees.delete',
  ],
  'Project Management': ['projects.read', 'projects.create', 'projects.update', 'projects.delete'],
  'Iqama Management': ['iqama.read', 'iqama.create', 'iqama.update', 'iqama.delete'],
  Reporting: ['reports.read', 'reports.create', 'reports.export'],
  Settings: ['settings.read', 'settings.update'],
  Analytics: ['analytics.read', 'analytics.export'],
};

export default function EditRolePage() {
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string || 'en';
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleId = params.id as string;

  useEffect(() => {
  const locale = params?.locale as string || 'en';
    const fetchRole = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/roles/${roleId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch role');
        }
        const data = await response.json();
        setRole(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast.error('Failed to fetch role data');
      } finally {
        setLoading(false);
      }
    };

    if (roleId) {
      fetchRole();
    }
  }, [roleId]);

  const handleSave = async () => {
    if (!role) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(role),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      toast.success('Role updated successfully');
      const locale = params?.locale as string || 'en';
      router.push(`/${locale}/user-management/role/${roleId}`);
    } catch (err) {
      toast.error('Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    const locale = params?.locale as string || 'en';
    router.push(`/${locale}/user-management/role/${roleId}`);
  };

  const handleCancel = () => {
    const locale = params?.locale as string || 'en';
    router.push(`/${locale}/user-management/role/${roleId}`);
  };

  const togglePermission = (permission: string) => {
    if (!role) return;

    const newPermissions = role.permissions.includes(permission)
      ? role.permissions.filter(p => p !== permission)
      : [...role.permissions, permission];

    setRole({ ...role, permissions: newPermissions });
  };

  const toggleAllPermissions = (category: string) => {
    if (!role) return;

    const categoryPermissions = permissionCategories[category as keyof typeof permissionCategories];
    const hasAllPermissions = categoryPermissions.every(p => role.permissions.includes(p));

    let newPermissions: string[];
    if (hasAllPermissions) {
      // Remove all permissions from this category
      newPermissions = role.permissions.filter(p => !categoryPermissions.includes(p));
    } else {
      // Add all permissions from this category
      newPermissions = [...role.permissions];
      categoryPermissions.forEach(p => {
        if (!newPermissions.includes(p)) {
          newPermissions.push(p);
        }
      });
    }

    setRole({ ...role, permissions: newPermissions });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading role data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Role not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Role</h1>
            <p className="text-muted-foreground">Update role information and permissions</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Role Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Role Information</span>
            </CardTitle>
            <CardDescription>Update role details and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                value={role.name}
                onChange={e => setRole({ ...role, name: e.target.value })}
                placeholder="Enter role name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={role.description}
                onChange={e => setRole({ ...role, description: e.target.value })}
                placeholder="Enter role description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="status"
                  checked={role.isActive}
                  onCheckedChange={checked => setRole({ ...role, isActive: checked })}
                />
                <Label htmlFor="status">{role.isActive ? 'Active' : 'Inactive'}</Label>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <p>Created: {new Date(role.createdAt).toLocaleDateString()}</p>
                <p>Users with this role: {role.userCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Permissions</span>
            </CardTitle>
            <CardDescription>Select permissions for this role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {permissionCategories && typeof permissionCategories === 'object' && Object.entries(permissionCategories).map(([category, permissions]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{category}</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAllPermissions(category)}
                  >
                    {permissions.every(p => role.permissions.includes(p))
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {permissions.map(permission => (
                    <div key={permission} className="flex items-center space-x-2">
                      <Checkbox
                        id={permission}
                        checked={role.permissions.includes(permission)}
                        onCheckedChange={() => togglePermission(permission)}
                      />
                      <Label htmlFor={permission} className="text-sm">
                        {permission}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
