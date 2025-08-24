'use client';

import { useSession } from 'next-auth/react';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DebugPermissionsPage() {
  const { data: session, status } = useSession();
  const { user, hasPermission, canAccessRoute } = useRBAC();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Not authenticated</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Debug Permissions</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Session Information</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>RBAC User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permission Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">User Management</h4>
              <div className="space-y-2">
                <div>Read User: <Badge variant={hasPermission('read', 'User') ? 'default' : 'secondary'}>{hasPermission('read', 'User') ? 'Yes' : 'No'}</Badge></div>
                <div>Manage User: <Badge variant={hasPermission('manage', 'User') ? 'default' : 'secondary'}>{hasPermission('manage', 'User') ? 'Yes' : 'No'}</Badge></div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Employee Management</h4>
              <div className="space-y-2">
                <div>Read Employee: <Badge variant={hasPermission('read', 'Employee') ? 'default' : 'secondary'}>{hasPermission('read', 'Employee') ? 'Yes' : 'No'}</Badge></div>
                <div>Manage Employee: <Badge variant={hasPermission('manage', 'Employee') ? 'default' : 'secondary'}>{hasPermission('manage', 'Employee') ? 'Yes' : 'No'}</Badge></div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Settings</h4>
              <div className="space-y-2">
                <div>Read Settings: <Badge variant={hasPermission('read', 'Settings') ? 'default' : 'secondary'}>{hasPermission('read', 'Settings') ? 'Yes' : 'No'}</Badge></div>
                <div>Manage Settings: <Badge variant={hasPermission('manage', 'Settings') ? 'default' : 'secondary'}>{hasPermission('manage', 'Settings') ? 'Yes' : 'No'}</Badge></div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Route Access Tests</h4>
              <div className="space-y-2">
                <div>User Management: <Badge variant={canAccessRoute('/modules/user-management') ? 'default' : 'secondary'}>{canAccessRoute('/modules/user-management') ? 'Yes' : 'No'}</Badge></div>
                <div>Employee Management: <Badge variant={canAccessRoute('/modules/employee-management') ? 'default' : 'secondary'}>{canAccessRoute('/modules/employee-management') ? 'Yes' : 'No'}</Badge></div>
                <div>Dashboard: <Badge variant={canAccessRoute('/dashboard') ? 'default' : 'secondary'}>{canAccessRoute('/dashboard') ? 'Yes' : 'No'}</Badge></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
