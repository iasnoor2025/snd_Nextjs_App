'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestHRPermissionsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fixHRPermissions = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/fix-hr-permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to fix HR_SPECIALIST permissions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Fix HR_SPECIALIST Permissions</CardTitle>
          <CardDescription>
            This will create/update the HR_SPECIALIST role with all necessary permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={fixHRPermissions} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Fixing Permissions...' : 'Fix HR_SPECIALIST Permissions'}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-red-800 font-medium">Error:</h3>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="text-green-800 font-medium">Success!</h3>
              <div className="text-green-600 space-y-2">
                <p><strong>Message:</strong> {result.message}</p>
                <p><strong>Role ID:</strong> {result.roleId}</p>
                <p><strong>Permissions Count:</strong> {result.permissionsCount}</p>
                <div>
                  <strong>Permissions:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {result.permissions?.map((perm: string, index: number) => (
                      <li key={index} className="text-sm">{perm}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-blue-800 font-medium">What this does:</h3>
            <ul className="text-blue-600 text-sm space-y-1 mt-2">
              <li>• Creates HR_SPECIALIST role if it doesn't exist</li>
              <li>• Creates all necessary permissions if they don't exist</li>
              <li>• Assigns 25+ permissions to the HR_SPECIALIST role</li>
              <li>• Includes read access to Employee, Leave, Report, User, Dashboard, etc.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
