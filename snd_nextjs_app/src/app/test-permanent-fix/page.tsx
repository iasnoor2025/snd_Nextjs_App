"use client";

import { useSession } from "next-auth/react";
import { useRBAC } from "@/lib/rbac/rbac-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

export default function TestPermanentFixPage() {
  const { data: session, status } = useSession();
  const { user: rbacUser, hasPermission } = useRBAC();

  const handleForceLogout = async () => {
    try {
      console.log('🔍 Starting force logout for permanent fix test...');
      
      // Clear all browser data
      localStorage.clear();
      sessionStorage.clear();
      console.log('🔍 Cleared localStorage and sessionStorage');
      
      // Clear all cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      console.log('🔍 Cleared all cookies');
      
      // Clear NextAuth specific cookies
      document.cookie = "next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "next-auth.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "__Secure-next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "__Host-next-auth.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      console.log('🔍 Cleared NextAuth cookies');
      
      // Sign out completely
      await signOut({ 
        callbackUrl: '/login',
        redirect: false 
      });
      console.log('🔍 Signed out');
      
      // Force page reload with cache busting
      const timestamp = new Date().getTime();
      window.location.href = `/login?t=${timestamp}&permanent=1`;
      
    } catch (error) {
      console.error('Force logout error:', error);
      window.location.reload();
    }
  };

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
          <CardTitle>Permanent Role Fix Test</CardTitle>
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
            <strong>Expected Results:</strong>
            <div className="mt-2 space-y-1 text-sm">
              <div>✅ Raw Session Role should be "ADMIN" (not "USER")</div>
              <div>✅ RBAC Processed Role should be "ADMIN"</div>
              <div>✅ All permissions should be "Allowed"</div>
              <div>✅ No temporary overrides should be used</div>
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
          <div className="pt-4">
            <Button onClick={handleForceLogout} variant="destructive">
              Force Logout & Test Permanent Fix
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              This will clear all session data and force a fresh login to test the permanent role assignment.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 