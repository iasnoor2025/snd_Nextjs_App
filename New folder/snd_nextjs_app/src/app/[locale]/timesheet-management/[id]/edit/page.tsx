
'use client';


// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { AlertCircle, ArrowLeft, Plus, Save, X } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Timesheet {
  id: string;
  employeeId: string;
  date: string;
  hoursWorked: number;
  overtimeHours: number;
  startTime: string;
  endTime: string;
  status: string;
  projectId?: string;
  rentalId?: string;
  assignmentId?: string;
  description?: string;
  tasksCompleted?: string;
  notes?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    user?: {
      name: string;
      email: string;
    };
  };
  project?: {
    id: string;
    name: string;
  };
  rental?: {
    id: string;
    rentalNumber: string;
  };
  assignment?: {
    id: string;
    name: string;
    type: string;
  };
}

export default function TimesheetEditPage() {
  return (
    <ProtectedRoute>
      <TimesheetEditContent />
    </ProtectedRoute>
  );
}

function TimesheetEditContent() {
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const router = useRouter();
  const timesheetId = params.id as string;

  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    hoursWorked: '',
    overtimeHours: '',
    startTime: '',
    endTime: '',
    description: '',
    tasksCompleted: '',
    notes: '',
  });

  useEffect(() => {
    const fetchTimesheet = async () => {
      if (!timesheetId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/timesheets/${timesheetId}`, {
          credentials: 'include',
        });

        if (response.status === 404) {
          setError('Timesheet not found');
          setLoading(false);
          return;
        }

        if (!response.ok) {
          let errorMessage = `Failed to fetch timesheet: ${response.status} ${response.statusText}`;

          try {
            const errorData = await response.json();
            if (errorData.error) {
              errorMessage = errorData.error;
              if (errorData.details) {
                errorMessage += ` - ${errorData.details}`;
              }
            }
          } catch (parseError) {
            // If we can't parse the error response, use the default message
            
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();

        // Handle both wrapped and direct response formats
        const timesheetData = data.timesheet || data;

        if (!timesheetData || !timesheetData.id) {
          
          throw new Error('Invalid API response format');
        }

        setTimesheet(timesheetData);

        // Initialize form data
        setFormData({
          date: timesheetData.date
            ? timesheetData.date.split('T')[0]
            : new Date().toISOString().split('T')[0],
          hoursWorked: timesheetData.hoursWorked?.toString() || '0',
          overtimeHours: timesheetData.overtimeHours?.toString() || '0',
          startTime: timesheetData.startTime
            ? new Date(timesheetData.startTime).toTimeString().slice(0, 5)
            : '',
          endTime: timesheetData.endTime
            ? new Date(timesheetData.endTime).toTimeString().slice(0, 5)
            : '',
          description: timesheetData.description || '',
          tasksCompleted: timesheetData.tasksCompleted || timesheetData.tasks || '',
          notes: timesheetData.notes || '',
        });

      } catch (error) {
        
        const errorMessage = error instanceof Error ? error.message : 'Failed to load timesheet';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchTimesheet();
  }, [timesheetId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!timesheet) return;

    try {
      setSaving(true);

      const response = await fetch(`/api/timesheets/${timesheetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hoursWorked: parseFloat(formData.hoursWorked) || 0,
          overtimeHours: parseFloat(formData.overtimeHours) || 0,
          description: formData.description,
          tasksCompleted: formData.tasksCompleted,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update timesheet');
      }

      toast.success('Timesheet updated successfully');
      router.push(`/${locale}/timesheet-management/${timesheetId}`);
    } catch (error) {
      toast.error('Failed to update timesheet');
      
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error === 'Timesheet not found' ? 'Timesheet Not Found' : 'Error Loading Timesheet'}
          </h2>
          <p className="text-gray-600 mb-6">
            {error === 'Timesheet not found'
              ? "The timesheet you're looking for doesn't exist."
              : error}
          </p>
          <div className="flex gap-4 justify-center">
            <Link href={`/${locale}/timesheet-management/create`}>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Create New Timesheet
              </Button>
            </Link>
            <Link href={`/${locale}/timesheet-management`}>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Timesheets
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!timesheet) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Timesheet Data</h2>
          <p className="text-gray-600 mb-4">Unable to load timesheet information.</p>
          <div className="flex gap-4 justify-center">
            <Link href={`/${locale}/timesheet-management/create`}>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Create New Timesheet
              </Button>
            </Link>
            <Link href={`/${locale}/timesheet-management`}>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Timesheets
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Only allow editing if timesheet is in draft status
  if (timesheet.status !== 'draft') {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cannot Edit Timesheet</h2>
          <p className="text-gray-600 mb-4">
            This timesheet cannot be edited because it&apos;s not in draft status. Current status:{' '}
            <span className="font-semibold">{timesheet.status}</span>
          </p>
          <div className="flex gap-2 justify-center">
            <Link href={`/${locale}/timesheet-management/${timesheet.id}`}>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                View Timesheet
              </Button>
            </Link>
            <Link href={`/${locale}/timesheet-management`}>
              <Button>Back to Timesheets</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/timesheet-management/${timesheet.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Timesheet</h1>
            <p className="text-gray-600">
              {timesheet.employee?.firstName} {timesheet.employee?.lastName} -{' '}
              {new Date(timesheet.date).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update timesheet details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={e => handleInputChange('date', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hoursWorked">Regular Hours</Label>
                  <Input
                    id="hoursWorked"
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={formData.hoursWorked}
                    onChange={e => handleInputChange('hoursWorked', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="overtimeHours">Overtime Hours</Label>
                  <Input
                    id="overtimeHours"
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={formData.overtimeHours}
                    onChange={e => handleInputChange('overtimeHours', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={e => handleInputChange('startTime', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={e => handleInputChange('endTime', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
              <CardDescription>Work description and notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Work Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the work performed..."
                  value={formData.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tasksCompleted">Tasks Completed</Label>
                <Textarea
                  id="tasksCompleted"
                  placeholder="List completed tasks..."
                  value={formData.tasksCompleted}
                  onChange={e => handleInputChange('tasksCompleted', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={e => handleInputChange('notes', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 mt-6">
          <Link href={`/${locale}/timesheet-management/${timesheet.id}`}>
            <Button type="button" variant="outline">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
