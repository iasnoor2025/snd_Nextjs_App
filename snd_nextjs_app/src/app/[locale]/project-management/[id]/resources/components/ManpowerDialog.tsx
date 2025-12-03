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
import ApiService from '@/lib/api-service';
import { format } from 'date-fns';
import { AlertTriangle, CalendarIcon, User, Users } from 'lucide-react';
import React, { useEffect, useState, useCallback } from 'react';
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
  const [originalTotalDays, setOriginalTotalDays] = useState<number | undefined>(initialData?.total_days);
  const [originalEndDate, setOriginalEndDate] = useState<string | undefined>(initialData?.end_date);
  const [duplicateWarnings, setDuplicateWarnings] = useState<string[]>([]);
  const [existingManpower, setExistingManpower] = useState<any[]>([]);
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

  // Load existing manpower resources and check all assignments across the app
  const loadExistingManpower = useCallback(async () => {
    try {
      const response = await ApiService.getProjectManpower(Number(projectId));
      if (response.success && response.data) {
        // Filter out current manpower if editing
        const existing = response.data.filter((item: any) => {
          if (initialData?.id && item.id?.toString() === initialData.id.toString()) {
            return false; // Exclude current item when editing
          }
          return true;
        });
        setExistingManpower(existing);
        console.log('Loaded existing manpower:', existing);
      }
    } catch (error) {
      console.error('Error loading existing manpower:', error);
      setExistingManpower([]);
    }
  }, [projectId, initialData?.id]);

  // Load existing manpower when dialog opens
  useEffect(() => {
    if (open) {
      loadExistingManpower();
    }
  }, [open, loadExistingManpower]);

  // Check for duplicate employee assignments across entire app (projects, rentals, assignments)
  useEffect(() => {
    const checkEmployeeAssignments = async () => {
      if (!open || !useEmployee || !formData.employee_id) {
        setDuplicateWarnings([]);
        return;
      }

      const warnings: string[] = [];
      const employeeIdStr = formData.employee_id.toString();
      const employeeId = parseInt(employeeIdStr);
      // Track rentals we've already warned about to avoid duplicates
      const warnedRentalIds = new Set<number>();

      try {
        // 1. Check project manpower (current project)
        const duplicateInProject = existingManpower.filter((item: any) => {
          if (!item.employeeId) return false;
          // Exclude current item if editing
          if (initialData?.id && item.id?.toString() === initialData.id.toString()) return false;
          return item.employeeId.toString() === employeeIdStr;
        });

        duplicateInProject.forEach((duplicate: any) => {
          const employeeName = duplicate.employeeFirstName && duplicate.employeeLastName
            ? `${duplicate.employeeFirstName} ${duplicate.employeeLastName}`.trim()
            : duplicate.employeeFirstName || duplicate.employeeLastName || 'Unknown';
          const jobTitle = duplicate.jobTitle || 'Unknown Job';
          const startDate = duplicate.startDate;
          const dateStr = startDate ? new Date(startDate).toLocaleDateString() : 'unknown date';
          warnings.push(`Already assigned in this project as "${jobTitle}" (started: ${dateStr})`);
        });

        // 2. Check employee assignments (assignment service) - across all projects and rentals
        try {
          const assignmentsResponse = await ApiService.get(`/employees/${employeeId}/assignments`);
          if (assignmentsResponse.success && assignmentsResponse.data) {
            const activeAssignments = assignmentsResponse.data.filter((assignment: any) => 
              assignment.status === 'active' || assignment.status === 'pending'
            );

            activeAssignments.forEach((assignment: any) => {
              // Check if assignment is to a project (including current project if different assignment)
              if (assignment.project_id) {
                const projectName = assignment.project?.name || `Project ${assignment.project_id}`;
                const startDate = assignment.start_date;
                const dateStr = startDate ? new Date(startDate).toLocaleDateString() : 'unknown date';
                if (assignment.project_id.toString() !== projectId) {
                  // Assignment to a different project
                  warnings.push(`Already assigned to project "${projectName}" (started: ${dateStr})`);
                } else if (assignment.name) {
                  // Assignment to current project via assignment service (not manpower)
                  warnings.push(`Already assigned to this project via assignment service: "${assignment.name}" (started: ${dateStr})`);
                }
              } else if (assignment.rental_id) {
                // Assignment to a rental - track to avoid duplicate warnings
                const rentalId = assignment.rental_id;
                if (!warnedRentalIds.has(rentalId)) {
                  warnedRentalIds.add(rentalId);
                  const rentalNumber = assignment.rental?.rental_number || `Rental ${rentalId}`;
                  const startDate = assignment.start_date;
                  const dateStr = startDate ? new Date(startDate).toLocaleDateString() : 'unknown date';
                  const assignmentName = assignment.name || 'Rental Operator';
                  warnings.push(`Already assigned to rental "${rentalNumber}" as "${assignmentName}" (started: ${dateStr})`);
                }
              } else if (assignment.name) {
                // Manual assignment (not linked to project or rental)
                const startDate = assignment.start_date;
                const dateStr = startDate ? new Date(startDate).toLocaleDateString() : 'unknown date';
                warnings.push(`Already has active assignment: "${assignment.name}" (started: ${dateStr})`);
              }
            });
          }
        } catch (assignmentsError) {
          console.error('Error checking employee assignments:', assignmentsError);
        }

        // 3. Check rental items where employee is operator (via previous-assignments endpoint for detailed info)
        // This provides more detailed equipment information that might not be in the assignment service
        try {
          const previousAssignmentsResponse = await ApiService.get(`/employees/${employeeId}/previous-assignments`);
          if (previousAssignmentsResponse && previousAssignmentsResponse.assignments) {
            const activeRentalAssignments = previousAssignmentsResponse.assignments.filter((assignment: any) => 
              assignment.role === 'operator' && 
              (assignment.status === 'active' || !assignment.completedDate)
            );

            activeRentalAssignments.forEach((assignment: any) => {
              if (assignment.rentalId && !warnedRentalIds.has(assignment.rentalId)) {
                warnedRentalIds.add(assignment.rentalId);
                const equipmentName = assignment.equipmentName || 'Unknown Equipment';
                const rentalNumber = assignment.rentalNumber || `Rental ${assignment.rentalId}`;
                const startDate = assignment.startDate;
                const dateStr = startDate ? new Date(startDate).toLocaleDateString() : 'unknown date';
                warnings.push(`Already assigned as operator to rental "${rentalNumber}" (Equipment: ${equipmentName}, started: ${dateStr})`);
              }
            });
          }
        } catch (rentalError) {
          console.error('Error checking rental operator assignments:', rentalError);
        }

        setDuplicateWarnings(warnings);
      } catch (error) {
        console.error('Error checking employee assignments:', error);
        setDuplicateWarnings([]);
      }
    };

    checkEmployeeAssignments();
  }, [open, useEmployee, formData.employee_id, existingManpower, projectId]);

  // No need to load employees here - handled by EmployeeDropdown component

  // Initialize form data when editing
  // Helper function to parse date string as local date and format for input (YYYY-MM-DD)
  const formatDateForInput = (dateString: string | undefined): string => {
    if (!dateString) return '';
    // Take just the date part (before T if present)
    return dateString.split('T')[0];
  };

  // Reset form function
  const resetForm = useCallback(() => {
    setFormData({
      employee_id: '',
      employee_name: '',
      employee_file_number: '',
      worker_name: '',
      name: '',
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
    setDuplicateWarnings([]);
    setOriginalTotalDays(undefined);
    setOriginalEndDate(undefined);
  }, []);

  // Reset form when dialog closes (if not editing)
  useEffect(() => {
    if (!open && !initialData) {
      resetForm();
    }
  }, [open, initialData, resetForm]);

  useEffect(() => {
    if (initialData) {
      // Helper function to parse date string as local date (avoids timezone issues)
      const parseLocalDate = (dateString: string | undefined): Date | null => {
        if (!dateString) return null;
        const dateStr = dateString.split('T')[0];
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
      };

      // Recalculate total_days from dates if both dates exist
      let calculatedTotalDays = initialData.total_days;
      if (initialData.start_date && initialData.end_date) {
        const start = parseLocalDate(initialData.start_date);
        const end = parseLocalDate(initialData.end_date);
        if (start && end) {
          const diffTime = end.getTime() - start.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          calculatedTotalDays = diffDays + 1; // Inclusive of both start and end days
        }
      }
      
      setOriginalTotalDays(calculatedTotalDays || initialData.total_days);
      setOriginalEndDate(initialData.end_date);
      setFormData({
        ...initialData,
        start_date: formatDateForInput(initialData.start_date),
        end_date: formatDateForInput(initialData.end_date),
        total_days: calculatedTotalDays || initialData.total_days || 0,
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
      resetForm();
    }
  }, [initialData, resetForm]);

  // Employee loading is now handled by the EmployeeDropdown component

  // Helper function to parse date string as local date (avoids timezone issues)
  const parseLocalDateString = (dateString: string): Date | null => {
    if (!dateString) return null;
    const dateStr = dateString.split('T')[0];
    const [year, month, day] = dateStr.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return new Date(year, month - 1, day);
  };

  // Calculate total days when start/end dates change
  useEffect(() => {
    if (formData.start_date) {
      const start = parseLocalDateString(formData.start_date);
      if (!start) return;
      
      // Only calculate if end date is provided
      if (formData.end_date) {
        const end = parseLocalDateString(formData.end_date);
        if (!end) return;
        
        // Ensure end date is not before start date
        if (end < start) {
          setFormData(prev => ({
            ...prev,
            total_days: 0,
            total_cost: 0,
          }));
          return;
        }
        
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        // Add 1 to include both start and end days (inclusive)
        const totalDays = diffDays + 1;

        setFormData(prev => ({
          ...prev,
          total_days: totalDays,
          total_cost: (prev.daily_rate || 0) * totalDays,
        }));
      } else {
        // If no end date in form, calculate from start_date to today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // If start date is in the future, default to 1 day
        if (start > today) {
          setFormData(prev => ({
            ...prev,
            total_days: 1,
            total_cost: (prev.daily_rate || 0) * 1,
          }));
          return;
        }
        
        // Calculate days from start_date to today
        const diffTime = today.getTime() - start.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const totalDays = diffDays + 1; // Include both start and end days (inclusive)
        
        setFormData(prev => ({
          ...prev,
          total_days: totalDays,
          total_cost: (prev.daily_rate || 0) * totalDays,
        }));
      }
    } else {
      // If no start date, reset total days and cost
      setFormData(prev => ({
        ...prev,
        total_days: 0,
        total_cost: 0,
      }));
    }
  }, [formData.start_date, formData.end_date, formData.daily_rate, originalTotalDays, originalEndDate]);

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

      // Handle daily rate - if cleared or set to 0, recalculate from employee's basic salary
      if (field === 'daily_rate') {
        const dailyRateValue = value === '' || value === null || value === undefined ? 0 : parseFloat(value) || 0;
        newData.daily_rate = dailyRateValue;
        
        // If daily rate is cleared/0 and we have an employee, recalculate from basic salary
        if ((dailyRateValue === 0 || value === '' || value === null) && prev.employee_id) {
          recalculateDailyRateFromEmployee(prev.employee_id, newData);
        }
      }

      return newData;
    });
  };

  // Function to recalculate daily rate from employee's basic salary
  const recalculateDailyRateFromEmployee = async (employeeId: string, currentFormData: ManpowerResource) => {
    try {
      // Fetch employee details to get basic salary
      const response = await ApiService.get(`/employees/${employeeId}`);
      if (response.success && response.data) {
        const selectedEmployee = response.data;
        
        if (selectedEmployee && selectedEmployee.basic_salary) {
          const basicSalary = parseFloat(selectedEmployee.basic_salary) || 0;
          const contractDaysPerMonth = selectedEmployee.contract_days_per_month || 30; // Default to 30 days
          const dailyRate = basicSalary > 0 && contractDaysPerMonth > 0 
            ? basicSalary / contractDaysPerMonth 
            : 0;
          
          setFormData(prev => ({
            ...prev,
            daily_rate: parseFloat(dailyRate.toFixed(2)),
          }));
        }
      } else {
        // Fallback: try fetching from public endpoint
        const fallbackResponse = await ApiService.get('/employees/public?all=true&limit=1000');
        if (fallbackResponse.success) {
          const data = fallbackResponse.data;
          const employeeData = data.data || data || [];
          const selectedEmployee = employeeData.find((emp: any) => emp.id === employeeId || emp.id?.toString() === employeeId);
          
          if (selectedEmployee && selectedEmployee.basic_salary) {
            const basicSalary = parseFloat(selectedEmployee.basic_salary) || 0;
            const contractDaysPerMonth = selectedEmployee.contract_days_per_month || 30; // Default to 30 days
            const dailyRate = basicSalary > 0 && contractDaysPerMonth > 0 
              ? basicSalary / contractDaysPerMonth 
              : 0;
            
            setFormData(prev => ({
              ...prev,
              daily_rate: parseFloat(dailyRate.toFixed(2)),
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error recalculating daily rate:', error);
      // Don't show error to user, just log it
    }
  };

  // Function to fetch employee details and populate form
  const fetchEmployeeDetails = async (employeeId: string, currentFormData: ManpowerResource) => {
    try {
      // Fetch specific employee details to get basic salary
      const response = await ApiService.get(`/employees/${employeeId}`);
      if (response.success && response.data) {
        const selectedEmployee = response.data;

        if (selectedEmployee) {
          setFormData(prev => {
            const newData = {
              ...prev,
              employee_name: `${selectedEmployee.first_name || ''} ${selectedEmployee.last_name || ''}`.trim(),
              employee_file_number: selectedEmployee.file_number || '',
              name: `${selectedEmployee.first_name || ''} ${selectedEmployee.last_name || ''}`.trim(),
            };

            // Calculate daily rate from basic salary if available
            // Set daily rate if it's not already set (0 or empty) to allow manual overrides
            if (selectedEmployee.basic_salary && (!prev.daily_rate || prev.daily_rate === 0)) {
              const basicSalary = parseFloat(selectedEmployee.basic_salary) || 0;
              const contractDaysPerMonth = selectedEmployee.contract_days_per_month || 30; // Default to 30 days
              const dailyRate = basicSalary > 0 && contractDaysPerMonth > 0 
                ? basicSalary / contractDaysPerMonth 
                : 0;
              newData.daily_rate = parseFloat(dailyRate.toFixed(2));
            }

            return newData;
          });
        }
      } else {
        // Fallback: try fetching from public endpoint if direct endpoint fails
        const fallbackResponse = await ApiService.get('/employees/public?all=true&limit=1000');
        if (fallbackResponse.success) {
          const data = fallbackResponse.data;
          const employeeData = data.data || data || [];
          const selectedEmployee = employeeData.find((emp: any) => emp.id === employeeId || emp.id?.toString() === employeeId);

          if (selectedEmployee) {
            setFormData(prev => {
              const newData = {
                ...prev,
                employee_name: `${selectedEmployee.first_name || ''} ${selectedEmployee.last_name || ''}`.trim(),
                employee_file_number: selectedEmployee.file_number || '',
                name: `${selectedEmployee.first_name || ''} ${selectedEmployee.last_name || ''}`.trim(),
              };

              // Calculate daily rate from basic salary if available
              // Set daily rate if it's not already set (0 or empty) to allow manual overrides
              if (selectedEmployee.basic_salary && (!prev.daily_rate || prev.daily_rate === 0)) {
                const basicSalary = parseFloat(selectedEmployee.basic_salary) || 0;
                const contractDaysPerMonth = selectedEmployee.contract_days_per_month || 30; // Default to 30 days
                const dailyRate = basicSalary > 0 && contractDaysPerMonth > 0 
                  ? basicSalary / contractDaysPerMonth 
                  : 0;
                newData.daily_rate = parseFloat(dailyRate.toFixed(2));
              }

              return newData;
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching employee details:', error);
      // Don't show error to user, just log it
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
      
      // Warning if employee is already assigned (but allow submission)
      if (duplicateWarnings.length > 0) {
        toast.warning(
          `Warning: ${duplicateWarnings[0]}. Creating duplicate assignment.`,
          { duration: 5000 }
        );
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

      // Transform frontend field names to match API expectations
      const submitData = {
        employeeId: formData.employee_id || null,
        workerName: formData.worker_name || null, // Send workerName for worker-based resources
        jobTitle: formData.job_title || '',
        dailyRate: formData.daily_rate || 0,
        startDate: formData.start_date || '',
        endDate: formData.end_date || null,
        totalDays: formData.total_days || 0,
        notes: formData.notes || '',
        type: 'manpower',
        name: formData.worker_name || formData.employee_name || formData.name || 'Unnamed Resource',
        total_cost: (formData.daily_rate || 0) * (formData.total_days || 0),
      };

      if (initialData?.id) {
        // Update existing manpower resource
        await ApiService.put(`/projects/${projectId}/manpower/${initialData.id}`, submitData);
        toast.success('Manpower resource updated successfully');
      } else {
        // Create new manpower resource
        try {
          const response = await ApiService.createProjectManpower(Number(projectId), submitData);
          
          toast.success('Manpower resource added successfully');
          // Reset form after successful creation
          resetForm();
        } catch (apiError) {
          // Re-throw the error to be handled by the outer catch block
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
                <div className="space-y-2">
                  <EmployeeDropdown
                    value={formData.employee_id || undefined}
                    onValueChange={value => handleInputChange('employee_id', value)}
                    label="Select Employee"
                    placeholder="Select an employee"
                    required={true}
                    showSearch={true}
                  />
                  {/* Duplicate Warning - Similar to rental items */}
                  {duplicateWarnings.length > 0 && (
                    <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 space-y-2">
                      <div className="flex items-start">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-yellow-800 mb-1">
                            Employee Already Assigned
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-xs text-yellow-700">
                            {duplicateWarnings.map((warning, index) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                          <p className="text-xs text-yellow-600 mt-2">
                            You can still proceed, but this will create a duplicate assignment.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
