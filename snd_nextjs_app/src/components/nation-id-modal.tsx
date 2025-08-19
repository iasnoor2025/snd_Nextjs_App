'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Info } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface MatchedEmployee {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  employee_id: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  nationality?: string;
  date_of_birth?: string;
  hire_date?: string;
  iqama_number?: string;
  iqama_expiry?: string;
  passport_number?: string;
  passport_expiry?: string;
  driving_license_number?: string;
  driving_license_expiry?: string;
  operator_license_number?: string;
  operator_license_expiry?: string;
  designation?: { name: string };
  department?: { name: string };
}

interface NationIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  matchedEmployee?: MatchedEmployee;
}

export function NationIdModal({
  isOpen,
  onClose,
  userName,
  userEmail,
  matchedEmployee,
}: NationIdModalProps) {
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
        onClose();
      } else {
        setError(data.error || 'Failed to save nation ID');
      }
    } catch (error) {
      
      setError('An error occurred while saving your nation ID');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    toast.info('You can update your nation ID later in your profile settings');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            Complete Your Profile
          </DialogTitle>
          <DialogDescription>
            Please provide your national ID to complete your profile setup.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {matchedEmployee ? (
            <Alert className="border-green-200 bg-green-50">
              <Info className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Employee Found!</strong> Your Nation ID matches an employee record in our
                system.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your national ID is required for account verification and compliance purposes.
              </AlertDescription>
            </Alert>
          )}

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

          {matchedEmployee && (
            <div className="space-y-2">
              <Label>Matched Employee Information</Label>
              <div className="text-sm text-muted-foreground space-y-1 p-3 bg-green-50 border border-green-200 rounded-md">
                <p>
                  <strong>Employee ID:</strong> {matchedEmployee.employee_id}
                </p>
                <p>
                  <strong>Full Name:</strong> {matchedEmployee.first_name}{' '}
                  {matchedEmployee.middle_name} {matchedEmployee.last_name}
                </p>
                <p>
                  <strong>Nationality:</strong> {matchedEmployee.nationality || 'Not specified'}
                </p>
                <p>
                  <strong>Designation:</strong>{' '}
                  {matchedEmployee.designation?.name || 'Not assigned'}
                </p>
                <p>
                  <strong>Department:</strong> {matchedEmployee.department?.name || 'Not assigned'}
                </p>
                <p>
                  <strong>Iqama Number:</strong> {matchedEmployee.iqama_number}
                </p>
                {matchedEmployee.iqama_expiry && (
                  <p>
                    <strong>Iqama Expiry:</strong>{' '}
                    {new Date(matchedEmployee.iqama_expiry).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}

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

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isLoading || !nationId.trim()} className="flex-1">
                {isLoading ? 'Saving...' : 'Save Nation ID'}
              </Button>
              <Button type="button" variant="outline" onClick={handleSkip} disabled={isLoading}>
                Skip for Now
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
