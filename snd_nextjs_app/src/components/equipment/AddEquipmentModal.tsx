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
import { useState, useEffect } from 'react';
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
  chassisNumber: string;
  doorNumber: string;
  purchaseDate: string;
  purchasePrice: string;
  status: string;
  categoryId: string | 'none';
  dailyRate: string;
  weeklyRate: string;
  monthlyRate: string;
  erpnextId: string;
  istimara: string;
  istimara_expiry_date: string;
  insurance: string;
  insurance_expiry_date: string;
  tuvCard: string;
  tuv_card_expiry_date: string;
  gps_install_date: string;
  gps_expiry_date: string;
  periodic_examination_date: string;
  periodic_examination_expiry_date: string;
}

interface EquipmentCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function AddEquipmentModal({
  open,
  onOpenChange,
  onSuccess,
}: AddEquipmentModalProps) {
  const { t } = useTranslation('equipment');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [formData, setFormData] = useState<EquipmentFormData>({
    name: '',
    description: '',
    manufacturer: '',
    modelNumber: '',
    serialNumber: '',
    chassisNumber: '',
    doorNumber: '',
    purchaseDate: '',
    purchasePrice: '',
    status: 'available',
    categoryId: 'none',
    dailyRate: '',
    weeklyRate: '',
    monthlyRate: '',
    erpnextId: '',
    istimara: '',
    istimara_expiry_date: '',
    insurance: '',
    insurance_expiry_date: '',
    tuvCard: '',
    tuv_card_expiry_date: '',
    gps_install_date: '',
    gps_expiry_date: '',
    periodic_examination_date: '',
    periodic_examination_expiry_date: '',
  });

  // Fetch categories when modal opens
  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/equipment/categories');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCategories(result.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleInputChange = (field: keyof EquipmentFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error(t('messages.nameRequired'));
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
        chassisNumber: formData.chassisNumber.trim() || undefined,
        doorNumber: formData.doorNumber.trim() || undefined,
        purchaseDate: formData.purchaseDate || undefined,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
        status: formData.status,
        categoryId: formData.categoryId === 'none' ? null : (formData.categoryId ? parseInt(formData.categoryId) : null),
        dailyRate: formData.dailyRate ? parseFloat(formData.dailyRate) : undefined,
        weeklyRate: formData.weeklyRate ? parseFloat(formData.weeklyRate) : undefined,
        monthlyRate: formData.monthlyRate ? parseFloat(formData.monthlyRate) : undefined,
        istimara: formData.istimara.trim() || undefined,
        istimara_expiry_date: formData.istimara_expiry_date || undefined,
        insurance: formData.insurance.trim() || undefined,
        insurance_expiry_date: formData.insurance_expiry_date || undefined,
        tuvCard: formData.tuvCard.trim() || undefined,
        tuv_card_expiry_date: formData.tuv_card_expiry_date || undefined,
        gps_install_date: formData.gps_install_date || undefined,
        gps_expiry_date: formData.gps_expiry_date || undefined,
        periodic_examination_date: formData.periodic_examination_date || undefined,
        periodic_examination_expiry_date: formData.periodic_examination_expiry_date || undefined,
        erpnextId: formData.erpnextId.trim() || undefined,
      };



      const response = await ApiService.createEquipment(payload);

      if (response.success) {
        // Show success message with door number extraction info if applicable
        const created = (response as { doorNumberExtracted?: boolean; extractedDoorNumber?: string; success: boolean; data?: unknown });
        if (created.doorNumberExtracted && created.extractedDoorNumber) {
          toast.success(t('messages.createSuccessWithDoorNumber', { doorNumber: created.extractedDoorNumber }));
        } else {
          toast.success(t('messages.createSuccess'));
        }
        onSuccess();
        onOpenChange(false);
        // Reset form
        setFormData({
          name: '',
          description: '',
          manufacturer: '',
          modelNumber: '',
          serialNumber: '',
          chassisNumber: '',
          doorNumber: '',
          purchaseDate: '',
          purchasePrice: '',
          status: 'available',
          categoryId: 'none',
          dailyRate: '',
          weeklyRate: '',
          monthlyRate: '',
          erpnextId: '',
          istimara: '',
          istimara_expiry_date: '',
          insurance: '',
          insurance_expiry_date: '',
          tuvCard: '',
          tuv_card_expiry_date: '',
          gps_install_date: '',
          gps_expiry_date: '',
          periodic_examination_date: '',
          periodic_examination_expiry_date: '',
        });
      } else {
        toast.error(response.message || t('messages.createError'));
      }
    } catch {
      toast.error(t('messages.createError'));
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
            <h3 className="text-lg font-medium">{t('fields.basicInfo')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('fields.name')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  placeholder={t('fields.namePlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">{t('fields.status')}</Label>
                <Select
                  value={formData.status}
                  onValueChange={value => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">{t('status.available')}</SelectItem>
                    <SelectItem value="maintenance">{t('status.maintenance')}</SelectItem>
                    <SelectItem value="out_of_service">{t('status.out_of_service')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoryId">{t('fields.categoryId')}</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={value => handleInputChange('categoryId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('fields.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('fields.noCategory')}</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('fields.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                placeholder={t('fields.descriptionPlaceholder')}
                rows={3}
              />
            </div>
          </div>

          {/* Manufacturer & Model Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('fields.technicalInfo')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">{t('fields.manufacturer')}</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={e => handleInputChange('manufacturer', e.target.value)}
                  placeholder={t('fields.manufacturerPlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modelNumber">{t('fields.modelNumber')}</Label>
                <Input
                  id="modelNumber"
                  value={formData.modelNumber}
                  onChange={e => handleInputChange('modelNumber', e.target.value)}
                  placeholder={t('fields.modelNumberPlaceholder')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serialNumber">{t('fields.serialNumber')}</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={e => handleInputChange('serialNumber', e.target.value)}
                placeholder={t('fields.serialNumberPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chassisNumber">{t('fields.chassisNumber')}</Label>
              <Input
                id="chassisNumber"
                value={formData.chassisNumber}
                onChange={e => handleInputChange('chassisNumber', e.target.value)}
                placeholder={t('fields.chassisNumberPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doorNumber">{t('equipment_management.door_number')}</Label>
              <Input
                id="doorNumber"
                value={formData.doorNumber}
                onChange={e => handleInputChange('doorNumber', e.target.value)}
                placeholder={t('fields.doorNumberPlaceholder')}
              />
            </div>
          </div>

          {/* Purchase Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('fields.purchaseInfo')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">{t('fields.purchaseDate')}</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={e => handleInputChange('purchaseDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchasePrice">{t('fields.purchasePrice')}</Label>
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
            <h3 className="text-lg font-medium">{t('fields.financialInfo')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dailyRate">{t('fields.dailyRate')}</Label>
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
                <Label htmlFor="weeklyRate">{t('fields.weeklyRate')}</Label>
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
                <Label htmlFor="monthlyRate">{t('fields.monthlyRate')}</Label>
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
            <h3 className="text-lg font-medium">{t('fields.erpnextIntegration')}</h3>

            <div className="space-y-2">
              <Label htmlFor="erpnextId">{t('fields.erpnextId')}</Label>
              <Input
                id="erpnextId"
                value={formData.erpnextId}
                onChange={e => handleInputChange('erpnextId', e.target.value)}
                placeholder={t('fields.erpnextIdPlaceholder')}
              />
            </div>
          </div>

          {/* Istimara Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('fields.istimaraInfo')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="istimara">{t('fields.istimaraNumber')}</Label>
                <Input
                  id="istimara"
                  value={formData.istimara}
                  onChange={e => handleInputChange('istimara', e.target.value)}
                  placeholder={t('fields.istimaraNumberPlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="istimara_expiry_date">{t('fields.istimaraExpiryDate')}</Label>
                <Input
                  id="istimara_expiry_date"
                  type="date"
                  value={formData.istimara_expiry_date}
                  onChange={e => handleInputChange('istimara_expiry_date', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Insurance Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('fields.insuranceInfo')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insurance">{t('fields.insuranceNumber')}</Label>
                <Input
                  id="insurance"
                  value={formData.insurance}
                  onChange={e => handleInputChange('insurance', e.target.value)}
                  placeholder={t('fields.insuranceNumberPlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurance_expiry_date">{t('fields.insuranceExpiryDate')}</Label>
                <Input
                  id="insurance_expiry_date"
                  type="date"
                  value={formData.insurance_expiry_date}
                  onChange={e => handleInputChange('insurance_expiry_date', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* TUV Card Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('fields.tuvCardInfo')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tuvCard">{t('fields.tuvCardNumber')}</Label>
                <Input
                  id="tuvCard"
                  value={formData.tuvCard}
                  onChange={e => handleInputChange('tuvCard', e.target.value)}
                  placeholder={t('fields.tuvCardNumberPlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tuv_card_expiry_date">{t('fields.tuvCardExpiryDate')}</Label>
                <Input
                  id="tuv_card_expiry_date"
                  type="date"
                  value={formData.tuv_card_expiry_date}
                  onChange={e => handleInputChange('tuv_card_expiry_date', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* GPS Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('fields.gpsInfo')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gps_install_date">{t('fields.gpsInstallDate')}</Label>
                <Input
                  id="gps_install_date"
                  type="date"
                  value={formData.gps_install_date}
                  onChange={e => handleInputChange('gps_install_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gps_expiry_date">{t('fields.gpsExpiryDate')}</Label>
                <Input
                  id="gps_expiry_date"
                  type="date"
                  value={formData.gps_expiry_date}
                  onChange={e => handleInputChange('gps_expiry_date', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Periodic Examination Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('fields.periodicExaminationInfo')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periodic_examination_date">{t('fields.periodicExaminationDate')}</Label>
                <Input
                  id="periodic_examination_date"
                  type="date"
                  value={formData.periodic_examination_date}
                  onChange={e => handleInputChange('periodic_examination_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="periodic_examination_expiry_date">{t('fields.periodicExaminationExpiryDate')}</Label>
                <Input
                  id="periodic_examination_expiry_date"
                  type="date"
                  value={formData.periodic_examination_expiry_date}
                  onChange={e => handleInputChange('periodic_examination_expiry_date', e.target.value)}
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
              {t('actions.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('messages.creating')}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('actions.addEquipment')}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
