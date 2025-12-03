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
  const [loadingEquipment, setLoadingEquipment] = useState(false);
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
        // Ensure date is in YYYY-MM-DD format
        date: initialData.date ? initialData.date.split('T')[0] : '',
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
      setLoadingEquipment(true);
      // Load equipment resources from the current project (like manpower)
      const response = await ApiService.getProjectEquipment(Number(projectId));
      console.log('Project Equipment API Response:', response);
      
      if (response.success && response.data) {
        console.log('Raw project equipment data:', response.data);
        // Map API response to expected frontend format
        const mappedEquipment = response.data.map((item: any) => ({
          id: item.id.toString(),
          name: item.equipmentName || item.name || 'Unknown Equipment',
          model_number: item.model || item.modelNumber || '',
          status: item.status || 'available',
        }));
        setEquipment(mappedEquipment);
        console.log('Loaded project equipment:', mappedEquipment);
      } else {
        console.warn('Failed to load project equipment:', response.message);
        // Fall back to mock data if no project equipment
        setEquipment([]);
      }
    } catch (error) {
      console.error('Error loading project equipment:', error);
      // Use empty array if API fails
      setEquipment([]);
    } finally {
      setLoadingEquipment(false);
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
        supplier: '', // Default empty supplier
        equipmentId: formData.equipment_id ? parseInt(formData.equipment_id) : null,
        operatorId: null, // Default null operator
        usageNotes: formData.notes,
        purchaseDate: formData.date, // Add required purchaseDate field
      };

      if (initialData?.id) {
        await ApiService.put(`/projects/${projectId}/fuel?id=${initialData.id}`, submitData);
        toast.success('Fuel record updated successfully');
      } else {
        await ApiService.post(`/projects/${projectId}/fuel`, submitData);
        toast.success('Fuel record added successfully');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving fuel resource:', error);
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
              {loadingEquipment ? (
                <div className="flex items-center justify-center p-3 border border-gray-300 rounded-md bg-gray-50">
                  <span className="text-sm text-gray-500">Loading project equipment...</span>
                </div>
              ) : equipment.length === 0 ? (
                <div className="flex items-center justify-between p-3 border border-dashed border-gray-300 rounded-md bg-gray-50">
                  <span className="text-sm text-gray-500">No equipment assigned to this project</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={loadEquipment}
                  >
                    Refresh
                  </Button>
                </div>
              ) : (
                <Select
                  value={formData.equipment_id || undefined}
                  onValueChange={value => handleInputChange('equipment_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select equipment from project" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipment.map(eq => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.name} {eq.model_number && `(${eq.model_number})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {/* Show selected equipment details */}
              {formData.equipment_id && (
                <div className="rounded bg-green-100 p-3 mt-2">
                  <div className="text-sm font-medium text-green-700">Selected Equipment</div>
                  <div className="text-sm text-green-600 mt-1">
                    {formData.equipment_name}
                    {equipment.find(eq => eq.id === formData.equipment_id)?.model_number &&
                      ` (${equipment.find(eq => eq.id === formData.equipment_id)?.model_number})`}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuel_type">Fuel Type</Label>
              <Select
                value={formData.fuel_type || undefined}
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
                  {formData.date 
                    ? (() => {
                        const date = parseLocalDate(formData.date);
                        return date ? format(date, 'PPP') : formData.date;
                      })()
                    : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.date ? parseLocalDate(formData.date) || undefined : undefined}
                  onSelect={date =>
                    handleInputChange('date', formatDateForInput(date))
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
