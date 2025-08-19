'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Assignment {
  id: string;
  name: string;
  type: string;
  status: string;
  location?: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  assignedById?: string;
  projectId?: string;
  rentalId?: string;
  assignedBy?: {
    id: string;
    name: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
    status: string;
  };
  rental?: {
    id: string;
    rentalNumber: string;
    projectName: string;
    status: string;
  };
}

interface AssignmentModalProps {
  employeeId: string;
  assignment?: Assignment | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignmentModal({
  employeeId,
  assignment,
  onClose,
  onSuccess,
}: AssignmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    location: '',
    notes: '',
    projectId: 'none',
    rentalId: 'none',
  });

  useEffect(() => {
    if (assignment) {
      setFormData({
        name: assignment.name,
        startDate: assignment.startDate.split('T')[0],
        endDate: assignment.endDate ? assignment.endDate.split('T')[0] : '',
        location: assignment.location || '',
        notes: assignment.notes || '',
        projectId: assignment.projectId || 'none',
        rentalId: assignment.rentalId || 'none',
      });
    }
  }, [assignment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = assignment
        ? `/api/employees/${employeeId}/assignments/${assignment.id}`
        : `/api/employees/${employeeId}/assignments`;

      const method = assignment ? 'PUT' : 'POST';

      // Convert "none" values back to empty strings for API
      const submitData = {
        ...formData,
        projectId: formData.projectId === 'none' ? '' : formData.projectId,
        rentalId: formData.rentalId === 'none' ? '' : formData.rentalId,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || 'Assignment saved successfully');
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save assignment');
      }
    } catch (error) {
      
      toast.error('Failed to save assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{assignment ? 'Edit Assignment' : 'Add New Assignment'}</DialogTitle>
          <DialogDescription>
            {assignment
              ? 'Update the employee assignment details'
              : 'Create a new assignment for this employee'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Assignment Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                placeholder="Enter assignment name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={e => handleInputChange('location', e.target.value)}
                placeholder="Enter location"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={e => handleInputChange('startDate', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={e => handleInputChange('endDate', e.target.value)}
                min={formData.startDate}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectId">Project (Optional)</Label>
              <Select
                value={formData.projectId}
                onValueChange={value => handleInputChange('projectId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {/* Project options would be loaded from API */}
                  <SelectItem value="project1">Project 1</SelectItem>
                  <SelectItem value="project2">Project 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rentalId">Rental (Optional)</Label>
              <Select
                value={formData.rentalId}
                onValueChange={value => handleInputChange('rentalId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a rental" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Rental</SelectItem>
                  {/* Rental options would be loaded from API */}
                  <SelectItem value="rental1">Rental 1</SelectItem>
                  <SelectItem value="rental2">Rental 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={e => handleInputChange('notes', e.target.value)}
              placeholder="Enter any additional notes"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {assignment ? 'Update Assignment' : 'Create Assignment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
