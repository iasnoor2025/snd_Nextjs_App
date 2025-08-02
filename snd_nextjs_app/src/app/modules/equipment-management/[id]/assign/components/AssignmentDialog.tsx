'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmployeeDropdown } from '@/components/ui/employee-dropdown';
import { Calendar, User, MapPin, Package } from 'lucide-react';
import { toast } from 'sonner';

interface AssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string;
  onSuccess: () => void;
}

interface AssignmentForm {
  assignment_type: string;
  employee_id: string;
  project_id: string;
  start_date: string;
  end_date: string;
  location: string;
  notes: string;
}

export function AssignmentDialog({
  open,
  onOpenChange,
  equipmentId,
  onSuccess
}: AssignmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AssignmentForm>({
    assignment_type: 'project',
    employee_id: '',
    project_id: '',
    start_date: '',
    end_date: '',
    location: '',
    notes: ''
  });

  const assignmentTypes = [
    { value: 'project', label: 'Project Assignment' },
    { value: 'rental', label: 'Rental Assignment' },
    { value: 'manual', label: 'Manual Assignment' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form data
      if (!formData.assignment_type) {
        toast.error('Please select assignment type');
        return;
      }
      if (!formData.employee_id) {
        toast.error('Please select an employee');
        return;
      }
      if (!formData.start_date) {
        toast.error('Please select a start date');
        return;
      }

      // Submit assignment
      const response = await fetch(`/api/equipment/${equipmentId}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Equipment assigned successfully');
        onSuccess();
        onOpenChange(false);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to assign equipment');
      }
    } catch (error) {
      console.error('Error assigning equipment:', error);
      toast.error('Failed to assign equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof AssignmentForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Package className="mr-2 h-5 w-5" />
            Assign Equipment
          </DialogTitle>
          <DialogDescription>
            Create a new assignment for this equipment
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Assignment Type */}
          <div className="space-y-2">
            <Label htmlFor="assignment_type">Assignment Type *</Label>
            <Select value={formData.assignment_type} onValueChange={(value) => handleInputChange('assignment_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select assignment type" />
              </SelectTrigger>
              <SelectContent>
                {assignmentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Employee Selection */}
          <div className="space-y-2">
            <EmployeeDropdown
              value={formData.employee_id}
              onValueChange={(value) => handleInputChange('employee_id', value)}
              label="Employee"
              placeholder="Select an employee"
              required={true}
            />
          </div>

          {/* Project Selection (if project assignment) */}
          {formData.assignment_type === 'project' && (
            <div className="space-y-2">
              <Label htmlFor="project_id">Project *</Label>
              <Select value={formData.project_id} onValueChange={(value) => handleInputChange('project_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project1">Project Alpha</SelectItem>
                  <SelectItem value="project2">Project Beta</SelectItem>
                  <SelectItem value="project3">Project Gamma</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date (Optional)</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                min={formData.start_date || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Enter location (optional)"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about this assignment"
              rows={3}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Assigning...' : 'Assign Equipment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 