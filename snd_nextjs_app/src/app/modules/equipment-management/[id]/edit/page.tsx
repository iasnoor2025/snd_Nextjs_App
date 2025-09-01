'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { AlertCircle, ArrowLeft, Loader2, Package, Save } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { useTranslation } from 'react-i18next';

interface Equipment {
  id: number;
  name: string;
  model_number?: string;
  status: string;
  category_id?: number;
  manufacturer?: string;
  daily_rate?: number;
  weekly_rate?: number;
  monthly_rate?: number;
  erpnext_id?: string;
  istimara?: string;
  istimara_expiry_date?: string;
  serial_number?: string;
  chassis_number?: string;
  description?: string;
  door_number?: string;
}

export default function EquipmentEditPage() {
  const { t } = useTranslation('equipment');
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = useRBAC();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    model_number: '',
    status: 'available',
    manufacturer: '',
    daily_rate: '',
    weekly_rate: '',
    monthly_rate: '',
    serial_number: '',
    chassis_number: '',
    description: '',
    door_number: '',
    istimara: '',
    istimara_expiry_date: '',
  });

  const equipmentId = params.id as string;

  // Check if user has permission to edit equipment
  useEffect(() => {
    if (!hasPermission('update', 'Equipment')) {
      toast.error(t('messages.noPermission'));
      router.push('/modules/equipment-management');
      return;
    }
  }, [hasPermission, router, t]);

  useEffect(() => {
    if (equipmentId) {
      fetchEquipment();
    }
  }, [equipmentId]);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const response = await ApiService.getEquipmentItem(parseInt(equipmentId));
      if (response.success) {
        setEquipment(response.data);
        setFormData({
          name: response.data.name || '',
          model_number: response.data.model_number || '',
          status: response.data.status || 'available',
          manufacturer: response.data.manufacturer || '',
          daily_rate: response.data.daily_rate?.toString() || '',
          weekly_rate: response.data.weekly_rate?.toString() || '',
          monthly_rate: response.data.monthly_rate?.toString() || '',
          serial_number: response.data.serial_number || '',
          chassis_number: response.data.chassis_number || '',
          description: response.data.description || '',
          door_number: response.data.door_number || '',
          istimara: response.data.istimara || '',
          istimara_expiry_date: response.data.istimara_expiry_date || '',
        });
      } else {
        toast.error(t('messages.loadingError'));
        router.push('/modules/equipment-management');
      }
    } catch {
      toast.error(t('messages.loadingError'));
      router.push('/modules/equipment-management');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!equipment) return;

    setSaving(true);
    try {
      const updateData = {
        ...formData,
        daily_rate: formData.daily_rate ? parseFloat(formData.daily_rate) : null,
        weekly_rate: formData.weekly_rate ? parseFloat(formData.weekly_rate) : null,
        monthly_rate: formData.monthly_rate ? parseFloat(formData.monthly_rate) : null,
      };

      const response = await ApiService.updateEquipment(equipment.id, updateData);
      if (response.success) {
        // Show success message with door number extraction info if applicable
        const resAny = response as { doorNumberExtracted?: boolean; extractedDoorNumber?: string; success: boolean };
        if (resAny.doorNumberExtracted && resAny.extractedDoorNumber) {
          toast.success(t('messages.updateSuccessWithDoorNumber', { doorNumber: resAny.extractedDoorNumber }));
        } else {
          toast.success(t('messages.updateSuccess'));
        }
        router.push(`/modules/equipment-management/${equipmentId}`);
      } else {
        toast.error(t('messages.updateError'));
      }
    } catch {
      toast.error(t('messages.updateError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">{t('messages.loading')}</span>
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="w-full p-6">
        <div className="flex items-center justify-center py-8">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <span className="ml-2">{t('messages.notFound')}</span>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push(`/modules/equipment-management/${equipmentId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('actions.back')}
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{t('actions.editEquipment')}</h1>
              <p className="text-muted-foreground">{t('messages.editDescription')}</p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>{t('fields.basicInfo')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="door_number">{t('equipment_management.door_number')}</Label>
                    <Input
                      id="door_number"
                      value={formData.door_number}
                      onChange={e => handleInputChange('door_number', e.target.value)}
                      placeholder={t('equipment_management.door_number')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">{t('fields.status')} *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={value => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('fields.selectStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">{t('status.available')}</SelectItem>
                      <SelectItem value="rented">{t('status.rented')}</SelectItem>
                      <SelectItem value="maintenance">{t('status.maintenance')}</SelectItem>
                      <SelectItem value="out_of_service">{t('status.out_of_service')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">{t('fields.manufacturer')}</Label>
                    <Input
                      id="manufacturer"
                      value={formData.manufacturer}
                      onChange={e => handleInputChange('manufacturer', e.target.value)}
                      placeholder={t('fields.manufacturer')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model_number">{t('fields.modelNumber')}</Label>
                    <Input
                      id="model_number"
                      value={formData.model_number}
                      onChange={e => handleInputChange('model_number', e.target.value)}
                      placeholder={t('fields.modelNumber')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serial_number">{t('fields.serialNumber')}</Label>
                    <Input
                      id="serial_number"
                      value={formData.serial_number}
                      onChange={e => handleInputChange('serial_number', e.target.value)}
                      placeholder={t('fields.serialNumber')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chassis_number">{t('fields.chassisNumber')}</Label>
                    <Input
                      id="chassis_number"
                      value={formData.chassis_number}
                      onChange={e => handleInputChange('chassis_number', e.target.value)}
                      placeholder={t('fields.chassisNumber')}
                    />
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
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('fields.financialInfo')}</CardTitle>
                <CardDescription>{t('messages.financialDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="daily_rate">{t('fields.dailyRate')} (SAR)</Label>
                  <Input
                    id="daily_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.daily_rate}
                    onChange={e => handleInputChange('daily_rate', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weekly_rate">{t('fields.weeklyRate')} (SAR)</Label>
                  <Input
                    id="weekly_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.weekly_rate}
                    onChange={e => handleInputChange('weekly_rate', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthly_rate">{t('fields.monthlyRate')} (SAR)</Label>
                  <Input
                    id="monthly_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.monthly_rate}
                    onChange={e => handleInputChange('monthly_rate', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Istimara Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('fields.istimaraInfo')}</CardTitle>
                <CardDescription>{t('messages.istimaraDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="istimara">{t('fields.istimaraNumber')}</Label>
                    <Input
                      id="istimara"
                      value={formData.istimara}
                      onChange={e => handleInputChange('istimara', e.target.value)}
                      placeholder={t('fields.istimaraNumber')}
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
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/modules/equipment-management/${equipmentId}`)}
            >
              {t('actions.cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {t('actions.save')}
            </Button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
