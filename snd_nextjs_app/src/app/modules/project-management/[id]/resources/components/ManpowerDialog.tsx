'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmployeeDropdown, type Employee } from '@/components/ui/employee-dropdown';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import apiService from '@/lib/api';
import { format } from 'date-fns';
import { CalendarIcon, User, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ManpowerResource {
  id?: string;
  employee_id?: string;
  employee_name?: string;
  employee_file_number?: string;
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
  onSuccess,
}: ManpowerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [useEmployee, setUseEmployee] = useState(initialData?.employee_id ? true : false);
  const [formData, setFormData] = useState<ManpowerResource>({
    employee_id: '',
    employee_name: '',
    employee_file_number: '',
    worker_name: '',
    name: '', // Add name field
    job_title: '',
    start_date: '',
    end_date: '',
    daily_rate: 0,
    total_days: 0,
    total_cost: 0,
    notes: '',
    status: 'pending',
  });

  // No need to load employees here - handled by EmployeeDropdown component

  // Initialize form data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        start_date: initialData.start_date
          ? new Date(initialData.start_date).toISOString().split('T')[0]
          : '',
        end_date: initialData.end_date
          ? new Date(initialData.end_date).toISOString().split('T')[0]
          : '',
      });

      // Auto-detect if this is an employee or worker based on available data
      const hasEmployeeData =
        initialData.employee_id || initialData.employee_name || initialData.employee_file_number;
      const hasWorkerData = initialData.worker_name;

      if (hasEmployeeData) {
        setUseEmployee(true);
      } else if (hasWorkerData) {
        setUseEmployee(false);
      } else {
        // Default to worker if no data available
        setUseEmployee(false);
      }
    } else {
      setFormData({
        employee_id: '',
        employee_name: '',
        employee_file_number: '',
        worker_name: '',
        name: '', // Add name field
        job_title: '',
        start_date: '',
        end_date: '',
        daily_rate: 0,
        total_days: 0,
        total_cost: 0,
        notes: '',
        status: 'pending',
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
        total_cost: (prev.daily_rate || 0) * totalDays,
      }));
    }
  }, [formData.start_date, formData.end_date, formData.daily_rate]);

  const handleInputChange = async (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Handle employee selection
      if (field === 'employee_id') {
        if (value) {
          newData.employee_id = value;
          newData.worker_name = '';
          // Fetch employee details and populate the form
          fetchEmployeeDetails(value, newData);
        } else {
          newData.employee_id = '';
          newData.employee_name = '';
          newData.employee_file_number = '';
          newData.name = '';
        }
      }

      // Handle worker name
      if (field === 'worker_name') {
        newData.worker_name = value;
        newData.name = value; // Set name to worker name
        newData.employee_id = '';
        newData.employee_name = '';
        newData.employee_file_number = '';
      }

      return newData;
    });
  };

  // Function to fetch employee details and populate form
  const fetchEmployeeDetails = async (employeeId: string, currentFormData: ManpowerResource) => {
    try {
      const response = await fetch(`/api/employees/public?all=true&limit=1000`);
      if (response.ok) {
        const data = await response.json();
        const employeeData = data.data || data || [];
        const selectedEmployee = employeeData.find((emp: any) => emp.id === employeeId);

        if (selectedEmployee) {
          setFormData(prev => ({
            ...prev,
            employee_name: `${selectedEmployee.first_name} ${selectedEmployee.last_name}`,
            employee_file_number: selectedEmployee.file_number || '',
            name: `${selectedEmployee.first_name} ${selectedEmployee.last_name}`,
          }));
        }
      }
    } catch (error) {
      
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (
        useEmployee &&
        !formData.employee_id &&
        !formData.employee_name &&
        !formData.employee_file_number
      ) {
        toast.error('Please select an employee or provide employee details');
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

      // Ensure we have a valid name for the resource
      if (
        !formData.worker_name &&
        !formData.employee_id &&
        !formData.employee_name &&
        !formData.employee_file_number
      ) {
        toast.error('Either worker name or employee details must be provided');
        return;
      }

      const submitData = {
        ...formData,
        type: 'manpower',
        name: formData.worker_name || formData.employee_name || formData.name || 'Unnamed Resource',
        total_cost: (formData.daily_rate || 0) * (formData.total_days || 0),
      };

      if (initialData?.id) {
        
        await apiService.put(`/projects/${projectId}/resources/${initialData.id}`, submitData);
        toast.success('Manpower resource updated successfully');
      } else {
        
        try {
          const response = await apiService.post(`/projects/${projectId}/resources`, submitData);
          
          toast.success('Manpower resource added successfully');
        } catch (apiError) {
          
          throw apiError;
        }
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to save manpower resource';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUseEmployeeChange = (checked: boolean) => {
    setUseEmployee(checked);

    // Only clear form data if this is a new resource (not editing)
    if (!initialData) {
      if (checked) {
        setFormData(prev => ({
          ...prev,
          worker_name: '',
          name: '',
          employee_id: '',
          employee_name: '',
          employee_file_number: '',
          job_title: '',
          daily_rate: 0,
          total_days: 0,
          total_cost: 0,
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          employee_id: '',
          employee_name: '',
          employee_file_number: '',
          name: '',
          worker_name: '',
          job_title: '',
          daily_rate: 0,
          total_days: 0,
          total_cost: 0,
        }));
      }
    }
    // When editing existing resources, preserve the data and just switch the view
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
            {initialData
              ? 'Update the details for this manpower resource.'
              : 'Add a new manpower resource to this project.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee/Worker Selection */}
          <div className="rounded-lg bg-muted/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Link to Employee</h4>
                <p className="text-sm text-muted-foreground">
                  Do you want to connect this resource to an employee?
                </p>
              </div>
              <Switch
                checked={useEmployee}
                onCheckedChange={handleUseEmployeeChange}
                disabled={
                  !!(
                    initialData?.employee_id ||
                    initialData?.employee_name ||
                    initialData?.employee_file_number
                  )
                }
              />
            </div>
          </div>

          {useEmployee ? (
            <div className="space-y-4">
              {initialData &&
              (initialData.employee_id ||
                initialData.employee_name ||
                initialData.employee_file_number) ? (
                <div className="space-y-4">
                  <div className="rounded bg-gray-100 p-3">
                    <div className="text-sm font-medium text-gray-700">
                      Employee Information (Read-only)
                    </div>
                    {initialData.employee_id && (
                      <div className="text-sm text-gray-600 mt-1">
                        ID: {initialData.employee_id}
                      </div>
                    )}
                    {initialData.employee_name && (
                      <div className="text-sm text-gray-600 mt-1">
                        Name: {initialData.employee_name}
                      </div>
                    )}
                    {initialData.employee_file_number && (
                      <div className="text-sm text-gray-600 mt-1">
                        File #: {initialData.employee_file_number}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <EmployeeDropdown
                  value={formData.employee_id || ''}
                  onValueChange={value => handleInputChange('employee_id', value)}
                  label="Select Employee"
                  placeholder="Select an employee"
                  required={true}
                  showSearch={true}
                />
              )}

              {/* Employee Name and File Number - Show as read-only when employee is selected */}
              {formData.employee_id ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employee_name">Employee Name</Label>
                    <Input
                      id="employee_name"
                      value={formData.employee_name || ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employee_file_number">File Number</Label>
                    <Input
                      id="employee_file_number"
                      value={formData.employee_file_number || ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>
              ) : (
                /* Show editable fields only when no employee is selected */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employee_name">Employee Name</Label>
                    <Input
                      id="employee_name"
                      value={formData.employee_name || ''}
                      onChange={e => handleInputChange('employee_name', e.target.value)}
                      placeholder="Enter employee name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employee_file_number">File Number</Label>
                    <Input
                      id="employee_file_number"
                      value={formData.employee_file_number || ''}
                      onChange={e => handleInputChange('employee_file_number', e.target.value)}
                      placeholder="Enter file number"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="worker_name">Worker Name</Label>
              <Input
                id="worker_name"
                value={formData.worker_name || ''}
                onChange={e => handleInputChange('worker_name', e.target.value)}
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
              onChange={e => handleInputChange('job_title', e.target.value)}
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
                onChange={e => handleInputChange('start_date', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date (Optional)</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date || ''}
                onChange={e => handleInputChange('end_date', e.target.value)}
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
                onChange={e => handleInputChange('daily_rate', parseFloat(e.target.value))}
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
              onChange={e => handleInputChange('notes', e.target.value)}
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
