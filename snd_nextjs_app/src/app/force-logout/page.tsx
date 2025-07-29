"use client";

import { signOut } from "next-auth/react";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function ForceLogoutPage() {
  const handleForceLogout = async () => {
    try {
      console.log('🔍 Starting force logout...');
      
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
      
      // Step 4: Sign out completely
      await signOut({ 
        callbackUrl: '/login',
        redirect: false 
      });
      console.log('🔍 Signed out');
      
      // Step 5: Force page reload with cache busting
      const timestamp = new Date().getTime();
      window.location.href = `/login?t=${timestamp}&force=1`;
      
    } catch (error) {
      console.error('Force logout error:', error);
      // Fallback: just reload the page
      window.location.reload();
    }
  };

  useEffect(() => {
    // Auto-execute the force logout
    handleForceLogout();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Force Logout
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Forcing complete logout and session clear...</p>
          <Button onClick={handleForceLogout} variant="destructive">
            Force Logout Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 