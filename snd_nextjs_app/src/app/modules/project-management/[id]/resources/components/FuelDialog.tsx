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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import ApiService from '@/lib/api-service';
import { format } from 'date-fns';
import { CalendarIcon, Fuel } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Equipment {
  id: string;
  name: string;
  model_number?: string;
  status: string;
}

interface FuelResource {
  id?: string;
  equipment_id?: string;
  equipment_name?: string;
  fuel_type?: string;
  name?: string; // Add name field
  liters?: number;
  price_per_liter?: number;
  total_cost?: number;
  date?: string;
  notes?: string;
  status?: string;
}

interface FuelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  initialData?: FuelResource | null;
  onSuccess: () => void;
}

const FUEL_TYPES = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'petrol', label: 'Petrol' },
  { value: 'gasoline', label: 'Gasoline' },
  { value: 'lpg', label: 'LPG' },
];

export default function FuelDialog({
  open,
  onOpenChange,
  projectId,
  initialData,
  onSuccess,
}: FuelDialogProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FuelResource>({
    equipment_id: '',
    equipment_name: '',
    fuel_type: '',
    liters: 0,
    price_per_liter: 0,
    total_cost: 0,
    date: '',
    notes: '',
    status: 'pending',
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
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
      });
    } else {
      setFormData({
        equipment_id: '',
        equipment_name: '',
        fuel_type: '',
        liters: 0,
        price_per_liter: 0,
        total_cost: 0,
        date: '',
        notes: '',
        status: 'pending',
      });
    }
  }, [initialData]);

  const loadEquipment = async () => {
    try {
      const response = await ApiService.get<Equipment[]>('/equipment');
      setEquipment(response.data || []);
    } catch (error) {
      
      // Use mock data if API fails
      setEquipment([
        { id: '1', name: 'Excavator', model_number: 'CAT-320', status: 'available' },
        { id: '2', name: 'Bulldozer', model_number: 'CAT-D6', status: 'available' },
        { id: '3', name: 'Crane', model_number: 'LTM-1100', status: 'available' },
      ]);
    }
  };

  // Calculate total cost when liters or price per liter changes
  useEffect(() => {
    const totalCost = (formData.liters || 0) * (formData.price_per_liter || 0);
    setFormData(prev => ({
      ...prev,
      total_cost: totalCost,
    }));
  }, [formData.liters, formData.price_per_liter]);

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
          }
        } else {
          newData.equipment_id = '';
          newData.equipment_name = '';
        }
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
      if (!formData.fuel_type) {
        toast.error('Please select fuel type');
        return;
      }
      if (!formData.liters || formData.liters <= 0) {
        toast.error('Liters must be greater than 0');
        return;
      }
      if (!formData.price_per_liter || formData.price_per_liter <= 0) {
        toast.error('Price per liter must be greater than 0');
        return;
      }
      if (!formData.date) {
        toast.error('Date is required');
        return;
      }

      // Transform frontend field names to match API expectations
      const submitData = {
        fuelType: formData.fuel_type,
        quantity: formData.liters,
        unitPrice: formData.price_per_liter,
        supplier: formData.supplier,
        equipmentId: formData.equipment_id,
        operatorId: formData.operator_id,
        usageNotes: formData.notes,
        type: 'fuel',
        name: formData.name || `${formData.fuel_type} Fuel`,
        total_cost: (formData.liters || 0) * (formData.price_per_liter || 0),
      };

      if (initialData?.id) {
        await apiService.put(`/projects/${projectId}/fuel?id=${initialData.id}`, submitData);
        toast.success('Fuel record updated successfully');
      } else {
        await apiService.createProjectFuel(projectId, submitData);
        toast.success('Fuel record added successfully');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      
      toast.error('Failed to save fuel resource');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Fuel className="h-5 w-5 text-purple-600" />
            <span>{initialData ? 'Edit Fuel Resource' : 'Add Fuel Resource'}</span>
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Update the details for this fuel resource.'
              : 'Add a new fuel resource to this project.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Equipment and Fuel Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="equipment_id">Equipment</Label>
              <Select
                value={formData.equipment_id || ''}
                onValueChange={value => handleInputChange('equipment_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map(eq => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.name} {eq.model_number && `(${eq.model_number})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuel_type">Fuel Type</Label>
              <Select
                value={formData.fuel_type || ''}
                onValueChange={value => handleInputChange('fuel_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  {FUEL_TYPES.map(fuel => (
                    <SelectItem key={fuel.value} value={fuel.value}>
                      {fuel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quantity and Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="liters">Liters</Label>
              <Input
                id="liters"
                type="number"
                value={formData.liters || ''}
                onChange={e => handleInputChange('liters', parseFloat(e.target.value))}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_per_liter">Price per Liter (SAR)</Label>
              <Input
                id="price_per_liter"
                type="number"
                value={formData.price_per_liter || ''}
                onChange={e => handleInputChange('price_per_liter', parseFloat(e.target.value))}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(new Date(formData.date), 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.date ? new Date(formData.date) : undefined}
                  onSelect={date =>
                    handleInputChange('date', date?.toISOString().split('T')[0] || '')
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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
