'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wrench } from 'lucide-react';
import { toast } from 'sonner';
import apiService from '@/lib/api';

interface Equipment {
  id: string;
  name: string;
  model_number?: string;
  daily_rate?: number;
  status: string;
}

interface EquipmentResource {
  id?: string;
  equipment_id?: string;
  equipment_name?: string;
  operator_name?: string;
  start_date?: string;
  end_date?: string;
  hourly_rate?: number;
  usage_hours?: number;
  maintenance_cost?: number;
  total_cost?: number;
  notes?: string;
  status?: string;
}

interface EquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  initialData?: EquipmentResource | null;
  onSuccess: () => void;
}

export default function EquipmentDialog({
  open,
  onOpenChange,
  projectId,
  initialData,
  onSuccess
}: EquipmentDialogProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EquipmentResource>({
    equipment_id: '',
    equipment_name: '',
    operator_name: '',
    start_date: '',
    end_date: '',
    hourly_rate: 0,
    usage_hours: 0,
    maintenance_cost: 0,
    total_cost: 0,
    notes: '',
    status: 'pending'
  });

  // Load equipment when dialog opens
  useEffect(() => {
    if (open) {
      loadEquipment();
    }
  }, [open]);

  // Initialize form data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        start_date: initialData.start_date ? new Date(initialData.start_date).toISOString().split('T')[0] : '',
        end_date: initialData.end_date ? new Date(initialData.end_date).toISOString().split('T')[0] : '',
      });
    } else {
      setFormData({
        equipment_id: '',
        equipment_name: '',
        operator_name: '',
        start_date: '',
        end_date: '',
        hourly_rate: 0,
        usage_hours: 0,
        maintenance_cost: 0,
        total_cost: 0,
        notes: '',
        status: 'pending'
      });
    }
  }, [initialData]);

  const loadEquipment = async () => {
    try {
      const response = await apiService.getEquipment();
      setEquipment(response.data || []);
    } catch (error) {
      console.error('Error loading equipment:', error);
      // Use mock data if API fails
      setEquipment([
        { id: '1', name: 'Excavator', model_number: 'CAT-320', daily_rate: 800, status: 'available' },
        { id: '2', name: 'Bulldozer', model_number: 'CAT-D6', daily_rate: 600, status: 'available' },
        { id: '3', name: 'Crane', model_number: 'LTM-1100', daily_rate: 1200, status: 'available' }
      ]);
    }
  };

  // Calculate usage hours when start/end dates change
  useEffect(() => {
    if (formData.start_date) {
      const start = new Date(formData.start_date);
      const end = formData.end_date ? new Date(formData.end_date) : new Date();
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const usageHours = diffDays * 10; // 10 hours per day

      setFormData(prev => ({
        ...prev,
        usage_hours: usageHours,
        total_cost: (prev.hourly_rate * usageHours) + (prev.maintenance_cost || 0)
      }));
    }
  }, [formData.start_date, formData.end_date, formData.hourly_rate, formData.maintenance_cost]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Handle equipment selection
      if (field === 'equipment_id') {
        if (value) {
          const selectedEquipment = equipment.find(eq => eq.id === value);
          if (selectedEquipment) {
            newData.equipment_id = value;
            newData.equipment_name = selectedEquipment.name;
            // Calculate hourly rate from daily rate (assuming 8-hour workday)
            const hourlyRate = selectedEquipment.daily_rate ? selectedEquipment.daily_rate / 8 : 0;
            newData.hourly_rate = hourlyRate;
          }
        } else {
          newData.equipment_id = '';
          newData.equipment_name = '';
          newData.hourly_rate = 0;
        }
      }

      // Calculate total cost when hourly rate or usage hours change
      if (field === 'hourly_rate' || field === 'usage_hours' || field === 'maintenance_cost') {
        const hourlyRate = field === 'hourly_rate' ? value : newData.hourly_rate;
        const usageHours = field === 'usage_hours' ? value : newData.usage_hours;
        const maintenanceCost = field === 'maintenance_cost' ? value : newData.maintenance_cost;
        newData.total_cost = (hourlyRate * usageHours) + (maintenanceCost || 0);
      }

      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.equipment_id) {
        toast.error('Please select equipment');
        return;
      }
      if (!formData.start_date) {
        toast.error('Start date is required');
        return;
      }
      if (!formData.hourly_rate || formData.hourly_rate <= 0) {
        toast.error('Hourly rate must be positive');
        return;
      }
      if (!formData.usage_hours || formData.usage_hours <= 0) {
        toast.error('Usage hours must be positive');
        return;
      }

      const submitData = {
        ...formData,
        project_id: projectId,
        type: 'equipment',
        total_cost: (formData.hourly_rate * formData.usage_hours) + (formData.maintenance_cost || 0)
      };

      if (initialData?.id) {
        await apiService.updateProjectResource(projectId, initialData.id, submitData);
        toast.success('Equipment resource updated successfully');
      } else {
        await apiService.addProjectResource(projectId, submitData);
        toast.success('Equipment resource added successfully');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving equipment resource:', error);
      toast.error('Failed to save equipment resource');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Wrench className="h-5 w-5 text-green-600" />
            <span>{initialData ? 'Edit Equipment Resource' : 'Add Equipment Resource'}</span>
          </DialogTitle>
          <DialogDescription>
            {initialData ? 'Update the details for this equipment resource.' : 'Add a new equipment resource to this project.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          {/* Equipment Selection */}
          <div className="space-y-2">
            <Label htmlFor="equipment_id">Select Equipment</Label>
            <Select
              value={formData.equipment_id || ''}
              onValueChange={(value) => handleInputChange('equipment_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select equipment" />
              </SelectTrigger>
              <SelectContent>
                {equipment.map((eq) => (
                  <SelectItem key={eq.id} value={eq.id}>
                    {eq.name} {eq.model_number && `(${eq.model_number})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operator Name */}
          <div className="space-y-2">
            <Label htmlFor="operator_name">Operator Name</Label>
            <Input
              id="operator_name"
              value={formData.operator_name || ''}
              onChange={(e) => handleInputChange('operator_name', e.target.value)}
              placeholder="Enter operator name"
            />
          </div>

          {/* Rates and Hours */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Hourly Rate (SAR)</Label>
              <Input
                id="hourly_rate"
                type="number"
                value={formData.hourly_rate || ''}
                onChange={(e) => handleInputChange('hourly_rate', parseFloat(e.target.value))}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usage_hours">Usage Hours</Label>
              <Input
                id="usage_hours"
                type="number"
                value={formData.usage_hours || ''}
                onChange={(e) => handleInputChange('usage_hours', parseFloat(e.target.value))}
                placeholder="0"
                min="0"
                step="0.5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenance_cost">Maintenance Cost (SAR)</Label>
              <Input
                id="maintenance_cost"
                type="number"
                value={formData.maintenance_cost || ''}
                onChange={(e) => handleInputChange('maintenance_cost', parseFloat(e.target.value))}
                placeholder="0.00"
                step="0.01"
                min="0"
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
