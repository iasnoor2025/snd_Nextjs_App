'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import ApiService from '@/lib/api-service';
import { Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface AddEquipmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface EquipmentFormData {
  name: string;
  description: string;
  manufacturer: string;
  modelNumber: string;
  serialNumber: string;
  purchaseDate: string;
  purchasePrice: string;
  status: string;
  dailyRate: string;
  weeklyRate: string;
  monthlyRate: string;
  erpnextId: string;
  istimara: string;
  istimara_expiry_date: string;
}

export default function AddEquipmentModal({
  open,
  onOpenChange,
  onSuccess,
}: AddEquipmentModalProps) {
  const { t } = useTranslation('equipment');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EquipmentFormData>({
    name: '',
    description: '',
    manufacturer: '',
    modelNumber: '',
    serialNumber: '',
    purchaseDate: '',
    purchasePrice: '',
    status: 'available',
    dailyRate: '',
    weeklyRate: '',
    monthlyRate: '',
    erpnextId: '',
    istimara: '',
    istimara_expiry_date: '',
  });

  const handleInputChange = (field: keyof EquipmentFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Equipment name is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        manufacturer: formData.manufacturer.trim() || undefined,
        modelNumber: formData.modelNumber.trim() || undefined,
        serialNumber: formData.serialNumber.trim() || undefined,
        purchaseDate: formData.purchaseDate || undefined,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
        status: formData.status,
        dailyRate: formData.dailyRate ? parseFloat(formData.dailyRate) : undefined,
        weeklyRate: formData.weeklyRate ? parseFloat(formData.weeklyRate) : undefined,
        monthlyRate: formData.monthlyRate ? parseFloat(formData.monthlyRate) : undefined,
        istimara: formData.istimara.trim() || undefined,
        istimara_expiry_date: formData.istimara_expiry_date || undefined,
        erpnextId: formData.erpnextId.trim() || undefined,
      };

      const response = await ApiService.createEquipment(payload);

      if (response.success) {
        toast.success('Equipment created successfully!');
        onSuccess();
        onOpenChange(false);
        // Reset form
        setFormData({
          name: '',
          description: '',
          manufacturer: '',
          modelNumber: '',
          serialNumber: '',
          purchaseDate: '',
          purchasePrice: '',
          status: 'available',
          dailyRate: '',
          weeklyRate: '',
          monthlyRate: '',
          erpnextId: '',
          istimara: '',
          istimara_expiry_date: '',
        });
      } else {
        toast.error(response.message || 'Failed to create equipment');
      }
    } catch (error) {
      toast.error('Failed to create equipment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-green-600" />
            <span>{t('equipment_management.add_equipment')}</span>
          </DialogTitle>
          <DialogDescription>
            {t('equipment_management.add_equipment_description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Equipment Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  placeholder="Enter equipment name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={value => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="out_of_service">Out of Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                placeholder="Enter equipment description"
                rows={3}
              />
            </div>
          </div>

          {/* Manufacturer & Model Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Manufacturer & Model</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={e => handleInputChange('manufacturer', e.target.value)}
                  placeholder="Enter manufacturer name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modelNumber">Model Number</Label>
                <Input
                  id="modelNumber"
                  value={formData.modelNumber}
                  onChange={e => handleInputChange('modelNumber', e.target.value)}
                  placeholder="Enter model number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={e => handleInputChange('serialNumber', e.target.value)}
                placeholder="Enter serial number"
              />
            </div>
          </div>

          {/* Purchase Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Purchase Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={e => handleInputChange('purchaseDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase Price</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.purchasePrice}
                  onChange={e => handleInputChange('purchasePrice', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Rental Rates */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Rental Rates</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dailyRate">Daily Rate</Label>
                <Input
                  id="dailyRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.dailyRate}
                  onChange={e => handleInputChange('dailyRate', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weeklyRate">Weekly Rate</Label>
                <Input
                  id="weeklyRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.weeklyRate}
                  onChange={e => handleInputChange('weeklyRate', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlyRate">Monthly Rate</Label>
                <Input
                  id="monthlyRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monthlyRate}
                  onChange={e => handleInputChange('monthlyRate', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* ERPNext Integration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">ERPNext Integration</h3>

            <div className="space-y-2">
              <Label htmlFor="erpnextId">ERPNext ID</Label>
              <Input
                id="erpnextId"
                value={formData.erpnextId}
                onChange={e => handleInputChange('erpnextId', e.target.value)}
                placeholder="Enter ERPNext ID for synchronization"
              />
            </div>
          </div>

          {/* Istimara Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Istimara (Vehicle Registration)</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="istimara">Istimara Number</Label>
                <Input
                  id="istimara"
                  value={formData.istimara}
                  onChange={e => handleInputChange('istimara', e.target.value)}
                  placeholder="Enter Istimara number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="istimara_expiry_date">Istimara Expiry Date</Label>
                <Input
                  id="istimara_expiry_date"
                  type="date"
                  value={formData.istimara_expiry_date}
                  onChange={e => handleInputChange('istimara_expiry_date', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Equipment
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
