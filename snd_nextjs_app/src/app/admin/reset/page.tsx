'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Shield, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AdminResetPage() {
  const [isResetting, setIsResetting] = useState(false);
  const [resetResult, setResetResult] = useState<Record<string, any> | null>(null);

  const handleResetDatabase = async () => {
    if (
      !confirm(
        '⚠️ WARNING: This will delete ALL data from the database and create a fresh admin user. This action cannot be undone. Are you sure you want to continue?'
      )
    ) {
      return;
    }

    setIsResetting(true);
    setResetResult(null);

    try {
      toast.loading('Resetting database...');

      const response = await fetch('/api/admin/reset-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Database reset completed successfully!');
        setResetResult(result);
      } else {
        throw new Error(result.message || 'Reset failed');
      }
    } catch (error) {
      console.error('Error resetting database:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reset database');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-red-600">Database Reset</h1>
        <p className="text-gray-600 mt-2">Reset the database to a clean state with admin user</p>
      </div>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-700">
            <Trash2 className="h-5 w-5" />
            <span>Reset Database</span>
          </CardTitle>
          <CardDescription>
            This action will permanently delete all data and create a fresh admin user.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              <strong>⚠️ WARNING:</strong> This will delete ALL existing data including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All employees</li>
                <li>All payroll records</li>
                <li>All timesheets</li>
                <li>All users</li>
                <li>All other data</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
              <User className="h-4 w-4 mr-2" />
              New Admin User
            </h3>
            <div className="space-y-1 text-sm text-blue-700">
              <p>
                <strong>Email:</strong> admin@ias.com
              </p>
              <p>
                <strong>Password:</strong> password
              </p>
              <p>
                <strong>Role:</strong> admin
              </p>
            </div>
          </div>

          <Button
            onClick={handleResetDatabase}
            disabled={isResetting}
            variant="destructive"
            size="lg"
            className="w-full"
          >
            {isResetting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Resetting Database...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Reset Database
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {resetResult && (
        <Card className="mt-6 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-700">
              <Shield className="h-5 w-5" />
              <span>Reset Completed</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-green-700">✅ Database has been successfully reset!</p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Admin Credentials:</h4>
                <div className="space-y-1 text-sm text-green-700">
                  <p>
                    <strong>Email:</strong> {resetResult.credentials.email}
                  </p>
                  <p>
                    <strong>Password:</strong> {resetResult.credentials.password}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Next Steps:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                  <li>Use the admin credentials to log in</li>
                  <li>Sync employees from ERPNext if needed</li>
                  <li>Configure any additional settings</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
