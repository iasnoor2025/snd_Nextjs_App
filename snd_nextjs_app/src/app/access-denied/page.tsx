'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AccessDeniedPage() {
  const searchParams = useSearchParams();
  const requiredRole = searchParams.get('requiredRole');
  const currentRole = searchParams.get('currentRole');

  // Define role hierarchy for better messaging
  const roleHierarchy = {
    'SUPER_ADMIN': 6,
    'ADMIN': 5,
    'MANAGER': 4,
    'SUPERVISOR': 3,
    'OPERATOR': 2,
    'USER': 1,
  };

  const getRoleLevel = (role: string) => {
    return roleHierarchy[role.toUpperCase() as keyof typeof roleHierarchy] || 0;
  };

  const currentRoleLevel = currentRole ? getRoleLevel(currentRole) : 0;
  const requiredRoles = requiredRole?.split(',').map(r => r.trim()) || [];
  const maxRequiredLevel = Math.max(...requiredRoles.map(getRoleLevel));

  const hasSufficientRole = currentRoleLevel >= maxRequiredLevel;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <Shield className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            You don&apos;t have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Permission Required</p>
                <p className="text-sm text-muted-foreground">
                  This page requires one of the following roles: <strong>{requiredRole}</strong>
                </p>
                {currentRole && (
                  <p className="text-sm text-muted-foreground">
                    Your current role: <strong>{currentRole}</strong>
                  </p>
                )}
                {currentRole === 'SUPER_ADMIN' && !hasSufficientRole && (
                  <p className="text-sm text-blue-600 font-medium">
                    ⚠️ This appears to be a system configuration issue. SUPER_ADMIN should have access to all pages.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              If you believe you should have access to this page, please contact your administrator.
            </p>
            {currentRole === 'SUPER_ADMIN' && (
              <p className="text-sm text-blue-600">
                As a SUPER_ADMIN, you should have access to all system features. This may be a temporary configuration issue.
              </p>
            )}
          </div>

          <div className="flex flex-col space-y-2">
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Link>
            </Button>

            <Button variant="outline" asChild>
              <Link href="/login">
                Sign in with different account
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
