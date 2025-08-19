'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmployeeDropdown } from '@/components/ui/employee-dropdown';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface LeaveRequestForm {
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
}

export default function CreateLeaveRequestPage() {
  return (
    <ProtectedRoute>
      <CreateLeaveRequestContent />
    </ProtectedRoute>
  );
}

function CreateLeaveRequestContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<LeaveRequestForm>({
    employee_id: '',
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
  });

  const leaveTypes = [
    'Annual Leave',
    'Sick Leave',
    'Personal Leave',
    'Maternity Leave',
    'Study Leave',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form data
      if (!formData.employee_id) {
        toast.error('Please select an employee');
        return;
      }
      if (!formData.leave_type) {
        toast.error('Please select a leave type');
        return;
      }
      if (!formData.start_date) {
        toast.error('Please select a start date');
        return;
      }
      if (!formData.end_date) {
        toast.error('Please select an end date');
        return;
      }
      if (!formData.reason) {
        toast.error('Please provide a reason for leave');
        return;
      }

      // Calculate days requested
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      const daysRequested =
        Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      if (daysRequested < 1) {
        toast.error('End date must be after start date');
        return;
      }

      // Submit leave request
      const response = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          days: daysRequested,
        }),
      });

      if (response.ok) {
        toast.success('Leave request submitted successfully');
        router.push('/modules/leave-management');
      } else {
        try {
          const error = await response.json();
          toast.error(error.error || error.message || 'Failed to submit leave request');
        } catch (parseError) {
          
          toast.error('Failed to submit leave request');
        }
      }
    } catch (error) {
      
      toast.error('Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof LeaveRequestForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push('/modules/leave-management')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leave Management
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Request Leave</h1>
            <p className="text-muted-foreground">Submit a new leave request</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Employee Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Employee Selection
            </CardTitle>
            <CardDescription>Select the employee requesting leave</CardDescription>
          </CardHeader>
          <CardContent>
            <EmployeeDropdown
              value={formData.employee_id}
              onValueChange={value => handleInputChange('employee_id', value)}
              label="Employee"
              placeholder="Select an employee"
              required={true}
            />
          </CardContent>
        </Card>

        {/* Leave Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Leave Details
            </CardTitle>
            <CardDescription>Provide leave request details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Leave Type */}
            <div className="space-y-2">
              <Label htmlFor="leave_type">Leave Type *</Label>
              <Select
                value={formData.leave_type}
                onValueChange={value => handleInputChange('leave_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={e => handleInputChange('start_date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={e => handleInputChange('end_date', e.target.value)}
                  min={formData.start_date || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Leave *</Label>
              <Textarea
                value={formData.reason}
                onChange={e => handleInputChange('reason', e.target.value)}
                placeholder="Please provide a detailed reason for your leave request"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/modules/leave-management')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Leave Request'}
          </Button>
        </div>
      </form>
    </div>
  );
}
