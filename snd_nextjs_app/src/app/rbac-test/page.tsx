'use client';

import { useRBAC, usePermission } from '@/lib/rbac/rbac-context';
import { Can, RoleBased, AccessDenied } from '@/lib/rbac/rbac-components';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/protected-route';

export default function RBACTestPage() {
  const { user, hasPermission, getAllowedActions } = useRBAC();
  const canCreateEmployee = usePermission('create', 'Employee');
  const canReadEmployee = usePermission('read', 'Employee');
  const canUpdateEmployee = usePermission('update', 'Employee');
  const canDeleteEmployee = usePermission('delete', 'Employee');

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">RBAC Test Page</h1>
          <p className="text-muted-foreground">
            Test the Role-Based Access Control system
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current User Information</CardTitle>
            <CardDescription>
              Details about the currently logged-in user
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Name:</span>
                  <span>{user.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Email:</span>
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Role:</span>
                  <Badge variant="outline">{user.role}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Active:</span>
                  <Badge variant={user.isActive ? 'default' : 'secondary'}>
                    {user.isActive ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No user information available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permission Tests</CardTitle>
            <CardDescription>
              Test various permissions for Employee management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Employee Permissions</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span>Read:</span>
                    <Badge variant={canReadEmployee ? 'default' : 'secondary'}>
                      {canReadEmployee ? 'Allowed' : 'Denied'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Create:</span>
                    <Badge variant={canCreateEmployee ? 'default' : 'secondary'}>
                      {canCreateEmployee ? 'Allowed' : 'Denied'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Update:</span>
                    <Badge variant={canUpdateEmployee ? 'default' : 'secondary'}>
                      {canUpdateEmployee ? 'Allowed' : 'Denied'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Delete:</span>
                    <Badge variant={canDeleteEmployee ? 'default' : 'secondary'}>
                      {canDeleteEmployee ? 'Allowed' : 'Denied'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Allowed Actions for Employee</h4>
                <div className="space-y-1">
                  {getAllowedActions('Employee').map((action) => (
                    <Badge key={action} variant="outline" className="mr-1">
                      {action}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Component Tests</CardTitle>
            <CardDescription>
              Test RBAC components for conditional rendering
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Permission-Based Components</h4>
                <div className="space-y-2">
                  <Can action="create" subject="Employee">
                    <Button variant="default">Create Employee (Permission-based)</Button>
                  </Can>

                  <Can action="read" subject="Employee">
                    <Button variant="outline">View Employee (Permission-based)</Button>
                  </Can>

                  <Can action="delete" subject="Employee" fallback={<p className="text-muted-foreground">No delete permission</p>}>
                    <Button variant="destructive">Delete Employee (Permission-based)</Button>
                  </Can>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Role-Based Components</h4>
                <div className="space-y-2">
                  <RoleBased roles={['ADMIN', 'MANAGER']}>
                    <Button variant="default">Admin/Manager Action</Button>
                  </RoleBased>

                  <RoleBased roles={['SUPERVISOR', 'OPERATOR']}>
                    <Button variant="outline">Supervisor/Operator Action</Button>
                  </RoleBased>

                  <RoleBased roles={['USER']} fallback={<p className="text-muted-foreground">This action requires higher privileges</p>}>
                    <Button variant="secondary">User Action</Button>
                  </RoleBased>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access Control Examples</CardTitle>
            <CardDescription>
              Examples of different access control patterns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Employee Management</h4>
                <div className="space-y-1">
                  <Can action="read" subject="Employee">
                    <Button size="sm" variant="outline" className="w-full">View Employees</Button>
                  </Can>
                  <Can action="create" subject="Employee">
                    <Button size="sm" className="w-full">Add Employee</Button>
                  </Can>
                  <Can action="export" subject="Employee">
                    <Button size="sm" variant="outline" className="w-full">Export Data</Button>
                  </Can>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">System Administration</h4>
                <div className="space-y-1">
                  <Can action="manage" subject="Settings">
                    <Button size="sm" variant="outline" className="w-full">System Settings</Button>
                  </Can>
                  <Can action="reset" subject="all">
                    <Button size="sm" variant="destructive" className="w-full">Reset System</Button>
                  </Can>
                  <Can action="sync" subject="Employee">
                    <Button size="sm" variant="outline" className="w-full">Sync Data</Button>
                  </Can>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
