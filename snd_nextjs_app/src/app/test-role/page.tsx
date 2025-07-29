"use client";

import { useSession } from "next-auth/react";
import { useRBAC } from "@/lib/rbac/rbac-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TestRolePage() {
  const { data: session, status } = useSession();
  const { user: rbacUser, hasPermission } = useRBAC();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Not authenticated</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Role Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>User Email:</strong> {session.user?.email}
          </div>
          <div>
            <strong>Raw Session Role:</strong> 
            <Badge variant={session.user?.role === 'ADMIN' ? 'default' : 'secondary'} className="ml-2">
              {session.user?.role || 'UNKNOWN'}
            </Badge>
          </div>
          <div>
            <strong>RBAC Processed Role:</strong> 
            <Badge variant={rbacUser?.role === 'ADMIN' ? 'default' : 'secondary'} className="ml-2">
              {rbacUser?.role || 'UNKNOWN'}
            </Badge>
          </div>
          <div>
            <strong>Session Status:</strong> {status}
          </div>
          <div>
            <strong>Permission Tests:</strong>
            <div className="mt-2 space-y-1">
              <div>Create Employee: {hasPermission('create', 'Employee') ? '✅ Allowed' : '❌ Denied'}</div>
              <div>Read Employee: {hasPermission('read', 'Employee') ? '✅ Allowed' : '❌ Denied'}</div>
              <div>Update Employee: {hasPermission('update', 'Employee') ? '✅ Allowed' : '❌ Denied'}</div>
              <div>Delete Employee: {hasPermission('delete', 'Employee') ? '✅ Allowed' : '❌ Denied'}</div>
              <div>Sync Employee: {hasPermission('sync', 'Employee') ? '✅ Allowed' : '❌ Denied'}</div>
              <div>Export Employee: {hasPermission('export', 'Employee') ? '✅ Allowed' : '❌ Denied'}</div>
            </div>
          </div>
          <div>
            <strong>Full Session Data:</strong>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
          <div>
            <strong>RBAC User Data:</strong>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(rbacUser, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 