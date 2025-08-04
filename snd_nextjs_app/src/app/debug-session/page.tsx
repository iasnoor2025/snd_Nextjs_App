'use client';

import { useSession, signOut, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, LogOut, LogIn, RotateCcw } from 'lucide-react';

export default function DebugSessionPage() {
  const { data: session, status, update } = useSession();

  const handleForceRefresh = async () => {
    // Clear all session data
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear all cookies related to NextAuth
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Sign out completely
    await signOut({ redirect: false });
    
    // Force page reload
    window.location.reload();
  };

  const handleCompleteReset = async () => {
    // Clear all session data
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear all cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Clear specific NextAuth cookies
    const cookiesToClear = [
      'next-auth.session-token',
      'next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.session-token',
      '__Secure-next-auth.csrf-token',
      '__Host-next-auth.csrf-token'
    ];
    
    cookiesToClear.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
    
    // Sign out completely
    await signOut({ redirect: false });
    
    // Force redirect to login
    window.location.href = '/login';
  };

  const handleLogin = async () => {
    await signIn('credentials', {
      email: 'admin@ias.com',
      password: 'password123',
      redirect: false,
    });
  };

  const handleForceUpdate = async () => {
    // Force session update
    await update();
    console.log('🔍 DEBUG - Session update triggered');
  };

  const handleRefreshSession = async () => {
    try {
      const response = await fetch('/api/auth/refresh-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      console.log('🔍 DEBUG - Session refresh result:', data);
      
      if (data.success) {
        alert(`Session refreshed successfully!\nRole: ${data.user.role}\nName: ${data.user.name}\n\nDebug Info:\nRole ID: ${data.debug.role_id}\nUser Roles: ${data.debug.user_roles?.join(', ')}\nAssigned Role: ${data.debug.assigned_role}`);
        // Force session update after refresh
        await update();
        window.location.reload();
      } else {
        alert(`Session refresh failed: ${data.error}`);
      }
    } catch (error) {
      console.error('🔍 DEBUG - Session refresh error:', error);
      alert('Session refresh failed');
    }
  };

  const handleTestAuth = async () => {
    try {
      const response = await fetch('/api/test-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@ias.com',
          password: 'password123'
        })
      });
      
      const data = await response.json();
      console.log('🔍 DEBUG - Auth test result:', data);
      
      if (data.success) {
        alert(`Auth test successful!\nRole: ${data.user.role}\nName: ${data.user.name}`);
      } else {
        alert(`Auth test failed: ${data.error}`);
      }
    } catch (error) {
      console.error('🔍 DEBUG - Auth test error:', error);
      alert('Auth test failed');
    }
  };

  const handleLogoutAndRedirect = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Session Debug Page</h1>
        <div className="flex gap-2">
          <Button onClick={handleForceRefresh} variant="destructive">
            <RefreshCw className="h-4 w-4 mr-2" />
            Force Refresh Session
          </Button>
          <Button onClick={handleCompleteReset} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Complete Reset
          </Button>
          <Button onClick={handleForceUpdate} variant="secondary">
            <RotateCcw className="h-4 w-4 mr-2" />
            Force Update
          </Button>
          <Button onClick={handleRefreshSession} variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Session
          </Button>
          <Button onClick={handleTestAuth} variant="outline">
            <LogIn className="h-4 w-4 mr-2" />
            Test Auth
          </Button>
          <Button onClick={handleLogoutAndRedirect} variant="destructive">
            <LogOut className="h-4 w-4 mr-2" />
            Logout & Redirect
          </Button>
          <Button onClick={handleLogin} variant="outline">
            <LogIn className="h-4 w-4 mr-2" />
            Login Again
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Session Information */}
        <Card>
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
            <CardDescription>Current session state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Status:</span>
              <Badge variant={status === 'authenticated' ? 'default' : 'secondary'}>
                {status}
              </Badge>
            </div>
            
            {session?.user && (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-medium">User Email:</span>
                  <span className="text-sm">{session.user.email}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">User Name:</span>
                  <span className="text-sm">{session.user.name}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">User Role:</span>
                  <Badge variant={
                    session.user.role === 'SUPER_ADMIN' ? 'destructive' :
                    session.user.role === 'ADMIN' ? 'default' :
                    session.user.role === 'MANAGER' ? 'secondary' :
                    session.user.role === 'SUPERVISOR' ? 'outline' :
                    session.user.role === 'OPERATOR' ? 'secondary' :
                    session.user.role === 'EMPLOYEE' ? 'default' :
                    'secondary'
                  }>
                    {session.user.role}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">User ID:</span>
                  <span className="text-sm">{session.user.id}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">Is Active:</span>
                  <span className="text-sm">{session.user.isActive ? 'Yes' : 'No'}</span>
                </div>
              </>
            )}
            
            <Button onClick={() => signOut()} className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>

        {/* Raw Session Data */}
        <Card>
          <CardHeader>
            <CardTitle>Raw Session Data</CardTitle>
            <CardDescription>Complete session object</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-96">
              {JSON.stringify(session, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
          <CardDescription>How to fix session issues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. Check the console for debug messages</p>
          <p>2. Verify the role is correctly assigned</p>
          <p>3. If role is wrong, use "Force Refresh Session" button</p>
          <p>4. Check the browser's Network tab for API calls</p>
          <p>5. Clear browser cache and cookies if needed</p>
          <p>6. Try logging out and logging back in</p>
        </CardContent>
      </Card>
    </div>
  );
} 