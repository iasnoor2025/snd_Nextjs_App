'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestMyDashboardPermissionsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const setupMyDashboardPermissions = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/setup-mydashboard-permissions', { 
        method: 'POST' 
      });
      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to set up read.mydashboard permissions');
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
          <CardTitle>🔧 Setup read.mydashboard Permissions</CardTitle>
          <CardDescription>
            Create the read.mydashboard permission and assign it to SUPER_ADMIN and EMPLOYEE roles to control access to the Employee Dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={setupMyDashboardPermissions} 
            disabled={isLoading} 
            className="w-full"
          >
            {isLoading ? 'Setting up permissions...' : 'Setup read.mydashboard Permissions'}
          </Button>
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-red-800 font-medium">Error:</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}
          
          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="text-green-800 font-medium">Success!</h3>
              <div className="text-green-600 text-sm mt-2 space-y-1">
                <p><strong>Message:</strong> {result.message}</p>
                <p><strong>Permission ID:</strong> {result.permissionId}</p>
                <p><strong>Roles Assigned:</strong> {result.rolesAssigned.join(', ')}</p>
                <p><strong>Total Assignments:</strong> {result.assignmentsCount}</p>
              </div>
              
              {result.assignments && result.assignments.length > 0 && (
                <div className="mt-3">
                  <p className="font-medium">Assignments:</p>
                  <ul className="text-sm space-y-1">
                    {result.assignments.map((assignment: any, index: number) => (
                      <li key={index}>
                        • {assignment.role} → {assignment.permission}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-blue-800 font-medium">What this does:</h3>
            <ul className="text-blue-600 text-sm space-y-1 mt-2">
              <li>• Creates <code>read.mydashboard</code> permission if it doesn't exist</li>
              <li>• Assigns it to SUPER_ADMIN and EMPLOYEE roles</li>
              <li>• Controls access to the Employee Dashboard (/employee-dashboard)</li>
              <li>• Only users with this permission can access "My Dashboard"</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
