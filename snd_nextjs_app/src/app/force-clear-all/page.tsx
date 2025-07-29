"use client";

import { signOut } from "next-auth/react";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";

export default function ForceClearAllPage() {
  const handleNuclearClear = async () => {
    try {
      console.log('🔍 Starting NUCLEAR CLEAR...');
      
      // Step 1: Clear all browser data
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
      
      // Step 4: Clear any other potential cookies
      document.cookie = "next-auth.callback-url=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "next-auth.state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      console.log('🔍 Cleared additional NextAuth cookies');
      
      // Step 5: Sign out completely
      await signOut({ 
        callbackUrl: '/login',
        redirect: false 
      });
      console.log('🔍 Signed out');
      
      // Step 6: Force page reload with cache busting and clear cache
      const timestamp = new Date().getTime();
      window.location.href = `/login?t=${timestamp}&clear=1&nuclear=1`;
      
    } catch (error) {
      console.error('Nuclear clear error:', error);
      // Fallback: just reload the page
      window.location.reload();
    }
  };

  useEffect(() => {
    // Auto-execute the nuclear clear
    handleNuclearClear();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Nuclear Session Clear
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-destructive font-medium">
            This will completely clear ALL session data and force a fresh login.
          </p>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>What this does:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Clears all browser storage</li>
              <li>Clears all cookies (including NextAuth)</li>
              <li>Signs out completely</li>
              <li>Forces fresh login with cache busting</li>
              <li>Prevents any session persistence</li>
            </ul>
          </div>
          <Button onClick={handleNuclearClear} variant="destructive" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Nuclear Clear Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 