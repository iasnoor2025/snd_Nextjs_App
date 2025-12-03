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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EmployeeDropdown } from '@/components/ui/employee-dropdown';
import ApiService from '@/lib/api-service';
import { format } from 'date-fns';
import { CalendarIcon, Target } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface TaskResource {
  id?: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  completion_percentage: number;
  assigned_to_id: string;
  assigned_to?: {
    id: string;
    name: string;
  };
  notes: string;
}

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  initialData?: TaskResource | null;
  onSuccess: () => void;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export default function TaskDialog({
  open,
  onOpenChange,
  projectId,
  initialData,
  onSuccess,
}: TaskDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TaskResource>({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
    completion_percentage: 0,
    assigned_to_id: 'none',
    notes: '',
  });

  // Helper function to parse date string as local date (avoids timezone issues)
  const parseLocalDate = (dateString: string | undefined): Date | null => {
    if (!dateString) return null;
    const dateStr = dateString.split('T')[0];
    const [year, month, day] = dateStr.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return new Date(year, month - 1, day);
  };

  // Helper function to format date for input (YYYY-MM-DD)
  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Initialize form data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        // Ensure due_date is in YYYY-MM-DD format
        due_date: initialData.due_date ? initialData.due_date.split('T')[0] : '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        due_date: '',
        completion_percentage: 0,
        assigned_to_id: 'none',
        notes: '',
      });
    }
  }, [initialData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.title) {
        toast.error('Task title is required');
        return;
      }
      if (!formData.status) {
        toast.error('Please select a status');
        return;
      }
      if (!formData.priority) {
        toast.error('Please select a priority');
        return;
      }
      if (
        formData.completion_percentage === undefined ||
        formData.completion_percentage < 0 ||
        formData.completion_percentage > 100
      ) {
        toast.error('Completion percentage must be between 0 and 100');
        return;
      }

      // If status is completed, set completion_percentage to 100
      let finalCompletionPercentage = formData.completion_percentage;
      if (formData.status === 'completed' && formData.completion_percentage < 100) {
        finalCompletionPercentage = 100;
      }

      const submitData = {
        name: formData.title || 'Task', // API expects 'name', not 'title'
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        assignedToId: formData.assigned_to_id === 'none' ? null : formData.assigned_to_id, // API expects 'assignedToId'
        dueDate: formData.due_date, // API expects 'dueDate'
        completionPercentage: finalCompletionPercentage, // API expects 'completionPercentage'
        type: 'tasks',
      };

      // Use the tasks endpoint for project tasks
      if (initialData?.id) {
        const response = await ApiService.put(`/projects/${projectId}/tasks/${initialData.id}`, submitData);
        if (response.success) {
          toast.success('Task updated successfully');
        } else {
          toast.error(response.message || 'Failed to update task');
          return;
        }
      } else {
        const response = await ApiService.post(`/projects/${projectId}/tasks`, submitData);
        if (response.success) {
          toast.success('Task created successfully');
        } else {
          toast.error(response.message || 'Failed to create task');
          return;
        }
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      // API service handles fallback to mock data, so this should rarely happen
      toast.error('Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span>{initialData ? 'Edit Task' : 'Add Task'}</span>
          </DialogTitle>
          <DialogDescription>
            {initialData ? 'Update the details for this task.' : 'Add a new task to this project.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={e => handleInputChange('title', e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={e => handleInputChange('description', e.target.value)}
              placeholder="Enter task description"
              rows={3}
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || 'pending'}
                onValueChange={value => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority || 'medium'}
                onValueChange={value => handleInputChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map(priority => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date and Completion Percentage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.due_date 
                      ? (() => {
                          const date = parseLocalDate(formData.due_date);
                          return date ? format(date, 'PPP') : formData.due_date;
                        })()
                      : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.due_date ? parseLocalDate(formData.due_date) || undefined : undefined}
                    onSelect={date =>
                      handleInputChange('due_date', formatDateForInput(date))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="completion_percentage">Completion Percentage</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="completion_percentage"
                  type="number"
                  value={formData.completion_percentage || 0}
                  onChange={e =>
                    handleInputChange('completion_percentage', parseInt(e.target.value))
                  }
                  min="0"
                  max="100"
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <Progress value={formData.completion_percentage || 0} className="mt-2" />
            </div>
          </div>

          {/* Assign To */}
          <div className="space-y-2">
            <Label htmlFor="assigned_to_id">Assign To</Label>
            <EmployeeDropdown
              value={formData.assigned_to_id === 'none' ? '' : formData.assigned_to_id}
              onValueChange={value => handleInputChange('assigned_to_id', value || 'none')}
              placeholder="Select employee to assign"
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
              {loading ? 'Saving...' : initialData ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
