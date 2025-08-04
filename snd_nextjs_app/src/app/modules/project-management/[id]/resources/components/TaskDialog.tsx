'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { CalendarIcon, Target } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import apiService from '@/lib/api';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  position?: string;
}

interface TaskResource {
  id?: string;
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  completion_percentage?: number;
  assigned_to_id?: string;
  assigned_to?: {
    id: string;
    name: string;
  };
  notes?: string;
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
  { value: 'cancelled', label: 'Cancelled' }
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
];

export default function TaskDialog({
  open,
  onOpenChange,
  projectId,
  initialData,
  onSuccess
}: TaskDialogProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TaskResource>({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
    completion_percentage: 0,
    assigned_to_id: 'none',
    notes: ''
  });

  // Load employees when dialog opens
  useEffect(() => {
    if (open) {
      loadEmployees();
    }
  }, [open]);

  // Initialize form data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        due_date: initialData.due_date ? new Date(initialData.due_date).toISOString().split('T')[0] : '',
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
        notes: ''
      });
    }
  }, [initialData]);

  const loadEmployees = async () => {
    try {
      const response = await apiService.get<{ data: Employee[] }>('/employees');
      setEmployees(response.data || []);
    } catch (error) {
      // API service already handles fallback to mock data
      setEmployees([]);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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
      if (formData.completion_percentage === undefined || formData.completion_percentage < 0 || formData.completion_percentage > 100) {
        toast.error('Completion percentage must be between 0 and 100');
        return;
      }

      // If status is completed, set completion_percentage to 100
      let finalCompletionPercentage = formData.completion_percentage;
      if (formData.status === 'completed' && formData.completion_percentage < 100) {
        finalCompletionPercentage = 100;
      }

      const submitData = {
        ...formData,
        completion_percentage: finalCompletionPercentage,
        assigned_to_id: formData.assigned_to_id === 'none' ? null : formData.assigned_to_id,
        type: 'tasks',
        name: formData.title || 'Task'
      };

      // TODO: Project resource endpoints don't exist yet
      // Implement these when the endpoints become available
      if (initialData?.id) {
        // await apiService.put(`/projects/${projectId}/resources/${initialData.id}`, submitData);
        toast.success('Task update feature not implemented yet');
      } else {
        // await apiService.post(`/projects/${projectId}/resources`, submitData);
        toast.success('Task add feature not implemented yet');
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
              onChange={(e) => handleInputChange('title', e.target.value)}
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
              onChange={(e) => handleInputChange('description', e.target.value)}
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
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
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
                onValueChange={(value) => handleInputChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((priority) => (
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
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.due_date ? format(new Date(formData.due_date), 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.due_date ? new Date(formData.due_date) : undefined}
                    onSelect={(date) => handleInputChange('due_date', date?.toISOString().split('T')[0] || '')}
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
                  onChange={(e) => handleInputChange('completion_percentage', parseInt(e.target.value))}
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
            <Select
              value={formData.assigned_to_id || 'none'}
              onValueChange={(value) => handleInputChange('assigned_to_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not Assigned</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name} - {employee.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              {loading ? 'Saving...' : initialData ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
