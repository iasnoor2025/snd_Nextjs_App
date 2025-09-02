'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, CheckCircle, Edit, Lock, Shield, Users, XCircle } from 'lucide-react';
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

export default function RoleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const roleId = params.id as string;

  useEffect(() => {
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
        toast.error('Failed to fetch role details');
      } finally {
        setLoading(false);
      }
    };

    if (roleId) {
      fetchRole();
    }
  }, [roleId]);

  const handleEdit = () => {
    router.push(`/modules/user-management/role/edit/${roleId}`);
  };

  const handleBack = () => {
    router.push('/modules/user-management');
  };

  const getPermissionCategory = (permission: string) => {
    if (permission.startsWith('users.')) return 'User Management';
    if (permission.startsWith('roles.')) return 'Role Management';
    if (permission.startsWith('equipment.')) return 'Equipment Management';
    if (permission.startsWith('rentals.')) return 'Rental Management';
    if (permission.startsWith('employees.')) return 'Employee Management';
    if (permission.startsWith('projects.')) return 'Project Management';
    if (permission.startsWith('reports.')) return 'Reporting';
    if (permission.startsWith('settings.')) return 'Settings';

    return 'Other';
  };

  const groupedPermissions =
    role?.permissions.reduce(
      (acc, permission) => {
        const category = getPermissionCategory(permission);
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(permission);
        return acc;
      },
      {} as Record<string, string[]>
    ) || {};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading role details...</div>
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
            <h1 className="text-3xl font-bold">Role Details</h1>
            <p className="text-muted-foreground">View role information and permissions</p>
          </div>
        </div>
        <Button onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Role
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Role Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role Information
            </CardTitle>
            <CardDescription>Basic role details and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Role Name</label>
              <p className="text-lg font-semibold">{role.name}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="text-muted-foreground">{role.description}</p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="flex items-center gap-2 mt-1">
                  {role.isActive ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <Badge variant="default">Active</Badge>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <Badge variant="outline">Inactive</Badge>
                    </>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Users Assigned</label>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="h-4 w-4" />
                  <Badge variant="secondary">{role.userCount} users</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Activity Information
            </CardTitle>
            <CardDescription>Role creation and usage information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created</label>
              <p className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(role.createdAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(role.createdAt).toLocaleTimeString()}
              </p>
            </div>

            <Separator />

            <div>
              <label className="text-sm font-medium text-muted-foreground">Role ID</label>
              <p className="text-sm font-mono bg-muted p-2 rounded mt-1">{role.id}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permissions Detail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Permissions ({role.permissions.length})
          </CardTitle>
          <CardDescription>Detailed breakdown of role permissions by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {groupedPermissions && typeof groupedPermissions === 'object' && Object.entries(groupedPermissions).map(([category, permissions]) => (
              <div key={category}>
                <h4 className="font-semibold mb-3 text-lg">{category}</h4>
                <div className="flex flex-wrap gap-2">
                  {permissions.map(permission => (
                    <Badge key={permission} variant="outline" className="text-sm">
                      {permission}
                    </Badge>
                  ))}
                </div>
                <Separator className="mt-4" />
              </div>
            ))}

            {role.permissions.length === 0 && (
              <div className="text-center py-8">
                <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No permissions assigned to this role</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usage Statistics
          </CardTitle>
          <CardDescription>Role usage and impact information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold">{role.userCount}</div>
              <div className="text-sm text-muted-foreground">Users Assigned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{role.permissions.length}</div>
              <div className="text-sm text-muted-foreground">Total Permissions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{role.isActive ? 'Active' : 'Inactive'}</div>
              <div className="text-sm text-muted-foreground">Status</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
