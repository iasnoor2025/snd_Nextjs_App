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
import { CalendarIcon, Package } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface MaterialResource {
  id?: string;
  material_id?: string;
  material_name?: string;
  name?: string; // Add name field
  quantity?: number;
  unit?: string;
  unit_price?: number;
  total_cost?: number;
  date_used?: string;
  notes?: string;
  status?: string;
}

interface MaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  initialData?: MaterialResource | null;
  onSuccess: () => void;
}

const MATERIALS = [
  { id: '1', name: 'Cement' },
  { id: '2', name: 'Steel' },
  { id: '3', name: 'Bricks' },
  { id: '4', name: 'Sand' },
  { id: '5', name: 'Gravel' },
  { id: '6', name: 'Wood' },
  { id: '7', name: 'Paint' },
  { id: '8', name: 'Other' },
];

const UNITS = [
  { value: 'pcs', label: 'Pieces' },
  { value: 'kg', label: 'Kilograms' },
  { value: 'm', label: 'Meters' },
  { value: 'm2', label: 'Square Meters' },
  { value: 'm3', label: 'Cubic Meters' },
  { value: 'l', label: 'Liters' },
  { value: 'box', label: 'Box' },
  { value: 'set', label: 'Set' },
];

export default function MaterialDialog({
  open,
  onOpenChange,
  projectId,
  initialData,
  onSuccess,
}: MaterialDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MaterialResource>({
    material_id: '',
    material_name: '',
    unit: '',
    quantity: 0,
    unit_price: 0,
    total_cost: 0,
    date_used: '',
    notes: '',
    status: 'pending',
  });

  // Initialize form data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        date_used: initialData.date_used
          ? new Date(initialData.date_used).toISOString().split('T')[0]
          : '',
      });
    } else {
      setFormData({
        material_id: '',
        material_name: '',
        unit: '',
        quantity: 0,
        unit_price: 0,
        total_cost: 0,
        date_used: '',
        notes: '',
        status: 'pending',
      });
    }
  }, [initialData]);

  // Calculate total cost when quantity or unit price changes
  useEffect(() => {
    const totalCost = (formData.quantity || 0) * (formData.unit_price || 0);
    setFormData(prev => ({
      ...prev,
      total_cost: totalCost,
    }));
  }, [formData.quantity, formData.unit_price]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Handle material selection
      if (field === 'material_id') {
        if (value) {
          const selectedMaterial = MATERIALS.find(mat => mat.id === value);
          if (selectedMaterial) {
            newData.material_id = value;
            newData.material_name = selectedMaterial.name;
          }
        } else {
          newData.material_id = '';
          newData.material_name = '';
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
      if (!formData.material_id) {
        toast.error('Please select a material');
        return;
      }
      if (!formData.unit) {
        toast.error('Please select a unit');
        return;
      }
      if (!formData.quantity || formData.quantity <= 0) {
        toast.error('Quantity must be greater than 0');
        return;
      }
      if (!formData.unit_price || formData.unit_price <= 0) {
        toast.error('Unit price must be greater than 0');
        return;
      }
      if (!formData.date_used) {
        toast.error('Date used is required');
        return;
      }

      // Transform frontend field names to match API expectations
      const submitData = {
        name:
          formData.name ||
          formData.material_name ||
          (formData.material_id
            ? MATERIALS.find(mat => mat.id === formData.material_id)?.name
            : ''),
        description: formData.description,
        category: formData.category,
        unit: formData.unit,
        quantity: formData.quantity,
        unitPrice: formData.unit_price,
        supplier: formData.supplier,
        orderDate: formData.date_used,
        notes: formData.notes,
        type: 'material',
        total_cost: (formData.quantity || 0) * (formData.unit_price || 0),
      };

      if (initialData?.id) {
        await apiService.put(`/projects/${projectId}/materials?id=${initialData.id}`, submitData);
        toast.success('Material updated successfully');
      } else {
        await apiService.createProjectMaterial(projectId, submitData);
        toast.success('Material added successfully');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      
      toast.error('Failed to save material resource');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-amber-600" />
            <span>{initialData ? 'Edit Material Resource' : 'Add Material Resource'}</span>
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Update the details for this material resource.'
              : 'Add a new material resource to this project.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Material and Unit Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="material_id">Material</Label>
              <Select
                value={formData.material_id || ''}
                onValueChange={value => handleInputChange('material_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {MATERIALS.map(material => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select
                value={formData.unit || ''}
                onValueChange={value => handleInputChange('unit', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map(unit => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quantity and Unit Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity || ''}
                onChange={e => handleInputChange('quantity', parseFloat(e.target.value))}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_price">Unit Price (SAR)</Label>
              <Input
                id="unit_price"
                type="number"
                value={formData.unit_price || ''}
                onChange={e => handleInputChange('unit_price', parseFloat(e.target.value))}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Date Used */}
          <div className="space-y-2">
            <Label htmlFor="date_used">Date Used</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date_used ? format(new Date(formData.date_used), 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.date_used ? new Date(formData.date_used) : undefined}
                  onSelect={date =>
                    handleInputChange('date_used', date?.toISOString().split('T')[0] || '')
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
