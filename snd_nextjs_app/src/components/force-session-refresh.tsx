'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

export function ForceSessionRefresh() {
  const handleForceRefresh = async () => {
    try {
      console.log('🔍 Starting force refresh...');
      
      // Step 1: Clear all browser data first
      localStorage.clear();
      sessionStorage.clear();
      console.log('🔍 Cleared localStorage and sessionStorage');
      
      // Step 2: Clear all cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      console.log('🔍 Cleared all cookies');
      
      // Step 3: Clear NextAuth specific cookies
      document.cookie = "next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "next-auth.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "__Secure-next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "__Host-next-auth.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      console.log('🔍 Cleared NextAuth cookies');
      
      // Step 4: Sign out completely
      await signOut({ 
        callbackUrl: '/login',
        redirect: false 
      });
      console.log('🔍 Signed out');
      
      // Step 5: Force page reload with cache busting
      const timestamp = new Date().getTime();
      window.location.href = `/login?t=${timestamp}`;
      
    } catch (error) {
      console.error('Force refresh error:', error);
      // Fallback: just reload the page
      window.location.reload();
    }
  };

  const handleDatabaseCheck = async () => {
    try {
      const response = await fetch('/api/debug-user?email=admin@ias.com');
      const data = await response.json();
      
      alert(`Database Check Results:\n\n` +
            `Role ID: ${data.user.role_id}\n` +
            `Calculated Role: ${data.user.role}\n` +
            `Should be ADMIN: ${data.user.role === 'ADMIN' ? 'YES' : 'NO'}\n\n` +
            `Check browser console for full details.`);
      
      console.log('🔍 Database Check Results:', data);
      
    } catch (error) {
      console.error('Database check error:', error);
      alert('Error checking database. Check console for details.');
    }
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Force Session Refresh
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            This will completely clear all session data and force a fresh login. 
            Use this if the role is showing as "USER" instead of "ADMIN".
          </AlertDescription>
        </Alert>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleDatabaseCheck}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Check Database
          </Button>
          
          <Button 
            onClick={handleForceRefresh}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Force Complete Refresh
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p><strong>What this does:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Signs out completely</li>
            <li>Clears all browser storage</li>
            <li>Clears all cookies</li>
            <li>Forces fresh login</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 