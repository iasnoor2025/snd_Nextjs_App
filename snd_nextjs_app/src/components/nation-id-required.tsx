'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Info, Shield } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface NationIdRequiredProps {
  userName: string;
  userEmail: string;
  onNationIdSet: () => void;
}

export function NationIdRequired({ userName, userEmail, onNationIdSet }: NationIdRequiredProps) {
  const [nationId, setNationId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nationId.trim()) {
      setError('Nation ID is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/user/nation-id', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nationId: nationId.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Nation ID saved successfully!');
        onNationIdSet();
      } else {
        setError(data.error || 'Failed to save nation ID');
      }
    } catch (error) {
      console.error('Error saving nation ID:', error);
      setError('An error occurred while saving your nation ID');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 mx-auto mb-4">
            <Shield className="h-8 w-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Profile Completion Required</h1>
          <p className="text-muted-foreground">
            Please provide your National ID to access the dashboard
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              Complete Your Profile
            </CardTitle>
            <CardDescription>
              Your National ID is required for account verification and compliance purposes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You cannot access the dashboard until you provide your National ID.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="user-info">User Information</Label>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>Name:</strong> {userName}
                </p>
                <p>
                  <strong>Email:</strong> {userEmail}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nation-id">National ID *</Label>
                <Input
                  id="nation-id"
                  type="text"
                  placeholder="Enter your national ID"
                  value={nationId}
                  onChange={e => {
                    setNationId(e.target.value);
                    setError('');
                  }}
                  disabled={isLoading}
                  className={error ? 'border-red-500' : ''}
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>

              <Button type="submit" disabled={isLoading || !nationId.trim()} className="w-full">
                {isLoading ? 'Saving...' : 'Save Nation ID & Continue'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
