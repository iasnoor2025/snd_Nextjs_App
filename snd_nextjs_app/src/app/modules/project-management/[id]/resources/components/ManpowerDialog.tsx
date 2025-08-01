'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Users, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { EmployeeDropdown, type Employee } from '@/components/ui/employee-dropdown';
import apiService from '@/lib/api';

interface ManpowerResource {
  id?: string;
  employee_id?: string;
  worker_name?: string;
  name?: string; // Add name field
  job_title?: string;
  start_date?: string;
  end_date?: string;
  daily_rate?: number;
  total_days?: number;
  total_cost?: number;
  notes?: string;
  status?: string;
}

interface ManpowerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  initialData?: ManpowerResource | null;
  onSuccess: () => void;
}

export default function ManpowerDialog({
  open,
  onOpenChange,
  projectId,
  initialData,
  onSuccess
}: ManpowerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [useEmployee, setUseEmployee] = useState(initialData?.employee_id ? true : false);
  const [formData, setFormData] = useState<ManpowerResource>({
    employee_id: '',
    worker_name: '',
    name: '', // Add name field
    job_title: '',
    start_date: '',
    end_date: '',
    daily_rate: 0,
    total_days: 0,
    total_cost: 0,
    notes: '',
    status: 'pending'
  });

  // No need to load employees here - handled by EmployeeDropdown component

  // Initialize form data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        start_date: initialData.start_date ? new Date(initialData.start_date).toISOString().split('T')[0] : '',
        end_date: initialData.end_date ? new Date(initialData.end_date).toISOString().split('T')[0] : '',
      });
      setUseEmployee(!!initialData.employee_id);
    } else {
      setFormData({
        employee_id: '',
        worker_name: '',
        name: '', // Add name field
        job_title: '',
        start_date: '',
        end_date: '',
        daily_rate: 0,
        total_days: 0,
        total_cost: 0,
        notes: '',
        status: 'pending'
      });
      setUseEmployee(false);
    }
  }, [initialData]);

  // Employee loading is now handled by the EmployeeDropdown component

  // Calculate total days when start/end dates change
  useEffect(() => {
    if (formData.start_date) {
      const start = new Date(formData.start_date);
      const end = formData.end_date ? new Date(formData.end_date) : new Date();
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      setFormData(prev => ({
        ...prev,
        total_days: totalDays,
        total_cost: (prev.daily_rate || 0) * totalDays
      }));
    }
  }, [formData.start_date, formData.end_date, formData.daily_rate]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Handle employee selection
      if (field === 'employee_id') {
        if (value) {
          newData.employee_id = value;
          newData.worker_name = '';
          // Name and other details will be populated when employee is selected
        } else {
          newData.employee_id = '';
          newData.name = '';
        }
      }

      // Handle worker name
      if (field === 'worker_name') {
        newData.worker_name = value;
        newData.name = value; // Set name to worker name
        newData.employee_id = '';
      }

      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (useEmployee && !formData.employee_id) {
        toast.error('Please select an employee');
        return;
      }
      if (!useEmployee && !formData.worker_name) {
        toast.error('Please enter a worker name');
        return;
      }
      if (!formData.job_title) {
        toast.error('Job title is required');
        return;
      }
      if (!formData.start_date) {
        toast.error('Start date is required');
        return;
      }
      if (!formData.daily_rate || formData.daily_rate <= 0) {
        toast.error('Daily rate must be positive');
        return;
      }

      const submitData = {
        ...formData,
        type: 'manpower',
        name: formData.name || formData.worker_name || '',
        total_cost: (formData.daily_rate || 0) * (formData.total_days || 0)
      };

      console.log('Submitting manpower data:', submitData);
      console.log('Project ID:', projectId);
      console.log('Form data before submit:', formData);
      console.log('Use employee:', useEmployee);

      if (initialData?.id) {
        console.log('Updating resource with ID:', initialData.id);
        await apiService.put(`/projects/${projectId}/resources/${initialData.id}`, submitData);
        toast.success('Manpower resource updated successfully');
      } else {
        console.log('Creating new resource');
        try {
          const response = await apiService.post(`/projects/${projectId}/resources`, submitData);
          console.log('API response:', response);
          toast.success('Manpower resource added successfully');
        } catch (apiError) {
          console.error('API Error details:', apiError);
          throw apiError;
        }
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving manpower resource:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save manpower resource';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUseEmployeeChange = (checked: boolean) => {
    setUseEmployee(checked);
    if (checked) {
      setFormData(prev => ({
        ...prev,
        worker_name: '',
        name: '', // Clear name when switching to employee
        employee_id: '',
        job_title: '',
        daily_rate: 0,
        total_days: 0,
        total_cost: 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        employee_id: '',
        name: '', // Clear name when switching to worker
        worker_name: '',
        job_title: '',
        daily_rate: 0,
        total_days: 0,
        total_cost: 0
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span>{initialData ? 'Edit Manpower Resource' : 'Add Manpower Resource'}</span>
          </DialogTitle>
          <DialogDescription>
            {initialData ? 'Update the details for this manpower resource.' : 'Add a new manpower resource to this project.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee/Worker Selection */}
          <div className="rounded-lg bg-muted/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Link to Employee</h4>
                <p className="text-sm text-muted-foreground">Do you want to connect this resource to an employee?</p>
              </div>
              <Switch 
                checked={useEmployee}
                onCheckedChange={handleUseEmployeeChange}
                disabled={!!initialData?.employee_id}
              />
            </div>
          </div>

          {useEmployee ? (
            <div className="space-y-2">
              {initialData && initialData.employee_id ? (
                <div className="rounded bg-gray-100 p-2 text-gray-800">
                  Employee ID: {initialData.employee_id}
                </div>
              ) : (
                <EmployeeDropdown
                  value={formData.employee_id || ''}
                  onValueChange={(value) => handleInputChange('employee_id', value)}
                  label="Select Employee"
                  placeholder="Select an employee"
                  required={true}
                  showSearch={true}
                />
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="worker_name">Worker Name</Label>
              <Input
                id="worker_name"
                value={formData.worker_name || ''}
                onChange={(e) => handleInputChange('worker_name', e.target.value)}
                placeholder="Enter worker name"
              />
            </div>
          )}

          {/* Job Title */}
          <div className="space-y-2">
            <Label htmlFor="job_title">Job Title</Label>
            <Input
              id="job_title"
              value={formData.job_title || ''}
              onChange={(e) => handleInputChange('job_title', e.target.value)}
              placeholder="Enter job title"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date || ''}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date (Optional)</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date || ''}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                min={formData.start_date}
              />
            </div>
          </div>

          {/* Daily Rate and Total Days */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="daily_rate">Daily Rate (SAR)</Label>
              <Input
                id="daily_rate"
                type="number"
                value={formData.daily_rate || ''}
                onChange={(e) => handleInputChange('daily_rate', parseFloat(e.target.value))}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_days">Total Days</Label>
              <Input
                id="total_days"
                type="number"
                value={formData.total_days || ''}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

          {/* Total Cost */}
          <div className="space-y-2">
            <Label htmlFor="total_cost">Total Cost (SAR)</Label>
            <Input
              id="total_cost"
              type="number"
              value={formData.total_cost || ''}
              readOnly
              className="bg-muted font-semibold"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Enter any additional notes"
              rows={3}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : initialData ? 'Update Resource' : 'Add Resource'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
