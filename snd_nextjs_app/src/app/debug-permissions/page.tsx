'use client';

import { useSession } from 'next-auth/react';
import { useRBAC, usePermission } from '@/lib/rbac/rbac-context';
import { Can } from '@/lib/rbac/rbac-components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ForceSessionRefresh } from '@/components/force-session-refresh';

export default function DebugPermissionsPage() {
  const { data: session, status } = useSession();
  const { user, hasPermission } = useRBAC();

  // Test permissions
  const canCreateEmployee = usePermission('create', 'Employee');
  const canReadEmployee = usePermission('read', 'Employee');
  const canUpdateEmployee = usePermission('update', 'Employee');
  const canDeleteEmployee = usePermission('delete', 'Employee');
  const canSyncEmployee = usePermission('sync', 'Employee');
  const canExportEmployee = usePermission('export', 'Employee');

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Not authenticated</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Permission Debug</h1>
      </div>
      
      <ForceSessionRefresh />
      
      <Card>
        <CardHeader>
          <CardTitle>Session Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Status:</strong> {status}</p>
            <p><strong>User ID:</strong> {session.user?.id}</p>
            <p><strong>Email:</strong> {session.user?.email}</p>
            <p><strong>Name:</strong> {session.user?.name}</p>
            <p><strong>Role:</strong> {session.user?.role}</p>
            <p className="text-sm text-muted-foreground mt-4">
              <strong>Note:</strong> If the role shows &quot;USER&quot; instead of &quot;ADMIN&quot;, 
              try the buttons above to force a complete session refresh. Check browser console for auth debug logs.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>1. Check Browser Console:</strong> Look for 🔍 AUTH DEBUG logs</p>
            <p><strong>2. Try Logout Button:</strong> Normal NextAuth logout</p>
            <p><strong>3. Try Force Clear:</strong> Clears all browser data</p>
            <p><strong>4. Database Test:</strong> Shows role should be ADMIN</p>
            <p className="text-muted-foreground mt-2">
              The database shows role_id: 1, which should give ADMIN role. 
              If you still see USER, it&apos;s a session/JWT caching issue.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>RBAC User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>User:</strong> {JSON.stringify(user, null, 2)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permission Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <strong>Create Employee:</strong> 
                <Badge variant={canCreateEmployee ? 'default' : 'secondary'}>
                  {canCreateEmployee ? 'Allowed' : 'Denied'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <strong>Read Employee:</strong> 
                <Badge variant={canReadEmployee ? 'default' : 'secondary'}>
                  {canReadEmployee ? 'Allowed' : 'Denied'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <strong>Update Employee:</strong> 
                <Badge variant={canUpdateEmployee ? 'default' : 'secondary'}>
                  {canUpdateEmployee ? 'Allowed' : 'Denied'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <strong>Delete Employee:</strong> 
                <Badge variant={canDeleteEmployee ? 'default' : 'secondary'}>
                  {canDeleteEmployee ? 'Allowed' : 'Denied'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <strong>Sync Employee:</strong> 
                <Badge variant={canSyncEmployee ? 'default' : 'secondary'}>
                  {canSyncEmployee ? 'Allowed' : 'Denied'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <strong>Export Employee:</strong> 
                <Badge variant={canExportEmployee ? 'default' : 'secondary'}>
                  {canExportEmployee ? 'Allowed' : 'Denied'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Can Component Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-semibold mb-2">Create Employee Button:</p>
              <Can action="create" subject="Employee">
                <Button>Create Employee (SHOULD SHOW)</Button>
              </Can>
              <p className="text-sm text-muted-foreground mt-1">
                {canCreateEmployee ? 'Button should be visible' : 'Button should be hidden'}
              </p>
            </div>

            <div>
              <p className="font-semibold mb-2">Sync Employee Button:</p>
              <Can action="sync" subject="Employee">
                <Button variant="outline">Sync Employee (SHOULD SHOW)</Button>
              </Can>
              <p className="text-sm text-muted-foreground mt-1">
                {canSyncEmployee ? 'Button should be visible' : 'Button should be hidden'}
              </p>
            </div>

            <div>
              <p className="font-semibold mb-2">Export Employee Button:</p>
              <Can action="export" subject="Employee">
                <Button variant="outline">Export Employee (SHOULD SHOW)</Button>
              </Can>
              <p className="text-sm text-muted-foreground mt-1">
                {canExportEmployee ? 'Button should be visible' : 'Button should be hidden'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 