'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function RefreshSessionPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRefreshSession = async () => {
    setRefreshStatus('loading');
    
    try {
      // Force session update
      await update();
      
      // Wait a moment then check the session
      setTimeout(() => {
        if (session?.user?.role === 'SUPER_ADMIN') {
          setRefreshStatus('success');
          // Redirect to dashboard
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
        } else {
          setRefreshStatus('error');
          setErrorMessage(`Session role is still ${session?.user?.role}, expected SUPER_ADMIN`);
        }
      }, 500);
      
    } catch (error) {
      setRefreshStatus('error');
      setErrorMessage('Session refresh failed');
      console.error('Session refresh error:', error);
    }
  };

  const handleForceReLogin = async () => {
    setRefreshStatus('loading');
    
    try {
      // Sign out completely
      await signOut({ redirect: false });
      
      // Clear all session data
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear all cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      // Wait a moment then sign back in
      setTimeout(async () => {
        const result = await signIn('credentials', {
          email: 'admin@ias.com',
          password: 'password123',
          redirect: false,
        });

        if (result?.error) {
          setRefreshStatus('error');
          setErrorMessage(result.error);
        } else if (result?.ok) {
          setRefreshStatus('success');
          // Wait a moment then redirect
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
      }, 500);
      
    } catch (error) {
      setRefreshStatus('error');
      setErrorMessage('Force re-login failed');
      console.error('Force re-login error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Session Refresh</CardTitle>
          <CardDescription className="text-center">
            Force refresh your session to get the correct role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {refreshStatus === 'loading' && (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Refreshing session...</span>
            </div>
          )}

          {refreshStatus === 'success' && (
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>Session refreshed! Redirecting...</span>
            </div>
          )}

          {refreshStatus === 'error' && (
            <div className="flex items-center justify-center space-x-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <span>Refresh failed: {errorMessage}</span>
            </div>
          )}

          {session?.user && (
            <div className="space-y-2 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium">Current Session:</h3>
              <div className="text-sm space-y-1">
                <div>Email: {session.user.email}</div>
                <div>Name: {session.user.name}</div>
                <div>
                  Role: <Badge variant={session.user.role === 'SUPER_ADMIN' ? 'destructive' : 'secondary'}>
                    {session.user.role}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <Button 
              onClick={handleRefreshSession} 
              disabled={refreshStatus === 'loading'}
              className="flex-1"
            >
              {refreshStatus === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Session
                </>
              )}
            </Button>
            <Button 
              onClick={handleForceReLogin} 
              disabled={refreshStatus === 'loading'}
              variant="destructive"
              className="flex-1"
            >
              Force Re-Login
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>This will refresh your session and update the header role display</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 