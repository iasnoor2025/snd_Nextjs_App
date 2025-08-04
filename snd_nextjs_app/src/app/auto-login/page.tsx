'use client';

import { useEffect, useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AutoLoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loginStatus, setLoginStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // If already authenticated with correct role, redirect to dashboard
    if (status === 'authenticated' && session?.user) {
      console.log('🔍 Already authenticated:', session.user);
      if (session.user.role === 'SUPER_ADMIN') {
        router.push('/dashboard');
      } else {
        // Force logout and re-login if role is wrong
        console.log('🔍 Wrong role detected, forcing re-login...');
        handleForceReLogin();
      }
      return;
    }

    // If not authenticated, auto-login
    if (status === 'unauthenticated') {
      handleAutoLogin();
    }
  }, [status, session, router]);

  const handleAutoLogin = async () => {
    setLoginStatus('loading');
    
    try {
      const result = await signIn('credentials', {
        email: 'admin@ias.com',
        password: 'password123',
        redirect: false,
      });

      if (result?.error) {
        setLoginStatus('error');
        setErrorMessage(result.error);
      } else if (result?.ok) {
        setLoginStatus('success');
        // Wait a moment then redirect
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (error) {
      setLoginStatus('error');
      setErrorMessage('Login failed');
      console.error('Auto-login error:', error);
    }
  };

  const handleForceReLogin = async () => {
    setLoginStatus('loading');
    
    try {
      // First, sign out completely
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
          setLoginStatus('error');
          setErrorMessage(result.error);
        } else if (result?.ok) {
          setLoginStatus('success');
          // Wait a moment then redirect
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
      }, 500);
      
    } catch (error) {
      setLoginStatus('error');
      setErrorMessage('Force re-login failed');
      console.error('Force re-login error:', error);
    }
  };

  const handleManualLogin = async () => {
    setLoginStatus('loading');
    await handleForceReLogin();
  };

  const handleGoToDebug = () => {
    router.push('/debug-session');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Auto Login</CardTitle>
          <CardDescription className="text-center">
            Automatically logging in with SUPER_ADMIN credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loginStatus === 'loading' && (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Logging in...</span>
            </div>
          )}

          {loginStatus === 'success' && (
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>Login successful! Redirecting...</span>
            </div>
          )}

          {loginStatus === 'error' && (
            <div className="flex items-center justify-center space-x-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <span>Login failed: {errorMessage}</span>
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
              onClick={handleManualLogin} 
              disabled={loginStatus === 'loading'}
              className="flex-1"
            >
              {loginStatus === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login Again'
              )}
            </Button>
            <Button 
              onClick={handleGoToDebug} 
              variant="outline"
              className="flex-1"
            >
              Debug Session
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>Email: ias.snd2024@gmail.com</p>
            <p>Password: password123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 