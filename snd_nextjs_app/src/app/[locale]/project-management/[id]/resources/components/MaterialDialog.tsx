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
import { CalendarIcon, Package, Plus, Pencil, Trash2, Settings } from 'lucide-react';
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

interface Material {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  unit?: string | null;
  isActive: boolean;
}

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
  const [materialsList, setMaterialsList] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [materialManageOpen, setMaterialManageOpen] = useState(false);
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

  // Fetch materials from API
  useEffect(() => {
    if (open) {
      fetchMaterials();
    }
  }, [open]);

  const fetchMaterials = async () => {
    setLoadingMaterials(true);
    try {
      const response = await ApiService.get('/materials');
      if (response.success && response.data) {
        setMaterialsList(response.data);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to load materials');
    } finally {
      setLoadingMaterials(false);
    }
  };

  // Initialize form data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        // Ensure date_used is in YYYY-MM-DD format
        date_used: initialData.date_used ? initialData.date_used.split('T')[0] : '',
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
          const selectedMaterial = materialsList.find(mat => mat.id.toString() === value);
          if (selectedMaterial) {
            newData.material_id = value;
            newData.material_name = selectedMaterial.name;
            // Auto-fill unit if material has a default unit
            if (selectedMaterial.unit && !newData.unit) {
              newData.unit = selectedMaterial.unit;
            }
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

      // Get selected material name
      const selectedMaterial = materialsList.find(mat => mat.id.toString() === formData.material_id);
      const materialName = selectedMaterial?.name || formData.material_name || formData.name || '';

      // Transform frontend field names to match API expectations
      const submitData = {
        name: materialName,
        description: formData.notes, // Use notes as description
        category: selectedMaterial?.category || formData.material_name || 'General',
        unit: formData.unit,
        quantity: formData.quantity,
        unitPrice: formData.unit_price,
        supplier: '', // Default empty supplier
        orderDate: formData.date_used,
        notes: formData.notes,
        type: 'material',
        total_cost: (formData.quantity || 0) * (formData.unit_price || 0),
      };

      if (initialData?.id) {
        await ApiService.put(`/projects/${projectId}/materials?id=${initialData.id}`, submitData);
        toast.success('Material updated successfully');
      } else {
        await ApiService.post(`/projects/${projectId}/materials`, submitData);
        toast.success('Material added successfully');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving material:', error);
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
              <div className="flex items-center justify-between">
                <Label htmlFor="material_id">Material</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMaterialManageOpen(true)}
                  className="h-7 px-2 text-xs"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Manage
                </Button>
              </div>
              <Select
                value={formData.material_id || undefined}
                onValueChange={value => handleInputChange('material_id', value)}
                disabled={loadingMaterials}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingMaterials ? "Loading..." : "Select material"} />
                </SelectTrigger>
                <SelectContent>
                  {materialsList.length === 0 && !loadingMaterials ? (
                    <SelectItem value="no-materials" disabled>
                      No materials available
                    </SelectItem>
                  ) : (
                    materialsList.map(material => (
                      <SelectItem key={material.id} value={material.id.toString()}>
                        {material.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select
                value={formData.unit || undefined}
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
                  {formData.date_used 
                    ? (() => {
                        const date = parseLocalDate(formData.date_used);
                        return date ? format(date, 'PPP') : formData.date_used;
                      })()
                    : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.date_used ? parseLocalDate(formData.date_used) || undefined : undefined}
                  onSelect={date =>
                    handleInputChange('date_used', formatDateForInput(date))
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

      {/* Material Management Dialog */}
      <MaterialManageDialog
        open={materialManageOpen}
        onOpenChange={setMaterialManageOpen}
        materials={materialsList}
        onRefresh={fetchMaterials}
      />
    </Dialog>
  );
}

// Material Management Dialog Component
interface MaterialManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materials: Material[];
  onRefresh: () => void;
}

function MaterialManageDialog({
  open,
  onOpenChange,
  materials,
  onRefresh,
}: MaterialManageDialogProps) {
  const [loading, setLoading] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    unit: '',
  });

  useEffect(() => {
    if (editingMaterial) {
      setFormData({
        name: editingMaterial.name || '',
        description: editingMaterial.description || '',
        category: editingMaterial.category || '',
        unit: editingMaterial.unit || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: '',
        unit: '',
      });
    }
  }, [editingMaterial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.name.trim()) {
        toast.error('Material name is required');
        return;
      }

      if (editingMaterial) {
        // Update
        await ApiService.put(`/materials/${editingMaterial.id}`, formData);
        toast.success('Material updated successfully');
      } else {
        // Create
        await ApiService.post('/materials', formData);
        toast.success('Material created successfully');
      }

      onRefresh();
      setEditingMaterial(null);
      setFormData({ name: '', description: '', category: '', unit: '' });
    } catch (error: any) {
      console.error('Error saving material:', error);
      const errorMessage = error?.message || error?.response?.message || error?.response?.data?.message || error?.response?.data?.error || 'Failed to save material';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (material: Material) => {
    if (!confirm(`Are you sure you want to delete "${material.name}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await ApiService.delete(`/materials/${material.id}`);
      toast.success('Material deleted successfully');
      onRefresh();
    } catch (error: any) {
      console.error('Error deleting material:', error);
      const errorMessage = error?.message || error?.response?.message || error?.response?.data?.message || error?.response?.data?.error || 'Failed to delete material';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-amber-600" />
            <span>Manage Materials</span>
          </DialogTitle>
          <DialogDescription>
            Create, edit, or delete materials that can be used in projects.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create/Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {editingMaterial ? 'Edit Material' : 'Add New Material'}
              </h3>
              {editingMaterial && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingMaterial(null)}
                >
                  Cancel Edit
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Cement, Steel"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Construction, Electrical"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Default Unit</Label>
              <Select
                value={formData.unit}
                onValueChange={value => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit (optional)" />
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

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                rows={2}
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingMaterial ? 'Update Material' : 'Add Material'}
            </Button>
          </form>

          {/* Materials List */}
          <div className="space-y-2">
            <h3 className="font-semibold">Existing Materials</h3>
            <div className="border rounded-lg divide-y">
              {materials.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No materials found. Create your first material above.
                </div>
              ) : (
                materials.map(material => (
                  <div
                    key={material.id}
                    className="p-4 flex items-center justify-between hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{material.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {material.category && <span>Category: {material.category}</span>}
                        {material.unit && (
                          <span className="ml-2">Unit: {UNITS.find(u => u.value === material.unit)?.label || material.unit}</span>
                        )}
                        {material.description && (
                          <div className="mt-1">{material.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingMaterial(material)}
                        disabled={loading}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(material)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
