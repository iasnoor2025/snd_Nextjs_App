
'use client';


// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

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
import { useTranslations } from '@/hooks/use-translations';

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
  insurance?: string;
  insurance_expiry_date?: string;
  tuv_card?: string;
  tuv_card_expiry_date?: string;
  gps_install_date?: string;
  gps_expiry_date?: string;
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

export default function EquipmentEditPage() {
  const { t } = useTranslations();
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = useRBAC();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    model_number: '',
    status: 'available',
    category_id: '',
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
    insurance: '',
    insurance_expiry_date: '',
    tuv_card: '',
    tuv_card_expiry_date: '',
    gps_install_date: '',
    gps_expiry_date: '',
  });

  const equipmentId = params.id as string;

  // Check if user has permission to edit equipment
  useEffect(() => {
    if (!hasPermission('update', 'Equipment')) {
      toast.error(t('equipment.messages.noPermission'));
      router.push('/modules/equipment-management');
      return;
    }
  }, [hasPermission, router, t]);

  useEffect(() => {
    if (equipmentId) {
      fetchEquipment();
      fetchCategories();
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
          category_id: response.data.category_id?.toString() || 'none',
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
          insurance: response.data.insurance || '',
          insurance_expiry_date: response.data.insurance_expiry_date || '',
          tuv_card: response.data.tuv_card || '',
          tuv_card_expiry_date: response.data.tuv_card_expiry_date || '',
          gps_install_date: response.data.gps_install_date || '',
          gps_expiry_date: response.data.gps_expiry_date || '',
        });
      } else {
        toast.error(t('equipment.messages.loadingError'));
        router.push('/modules/equipment-management');
      }
    } catch {
      toast.error(t('equipment.messages.loadingError'));
      router.push('/modules/equipment-management');
    } finally {
      setLoading(false);
    }
  };

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
        name: formData.name,
        description: formData.description,
        manufacturer: formData.manufacturer,
        modelNumber: formData.model_number,
        serialNumber: formData.serial_number,
        chassisNumber: formData.chassis_number,
        doorNumber: formData.door_number,
        status: formData.status,
        categoryId: formData.category_id === 'none' ? null : (formData.category_id ? parseInt(formData.category_id) : null),
        dailyRate: formData.daily_rate ? parseFloat(formData.daily_rate) : null,
        weeklyRate: formData.weekly_rate ? parseFloat(formData.weekly_rate) : null,
        monthlyRate: formData.monthly_rate ? parseFloat(formData.monthly_rate) : null,
        istimara: formData.istimara,
        istimara_expiry_date: formData.istimara_expiry_date,
        insurance: formData.insurance,
        insurance_expiry_date: formData.insurance_expiry_date,
        tuv_card: formData.tuv_card,
        tuv_card_expiry_date: formData.tuv_card_expiry_date,
        gps_install_date: formData.gps_install_date,
        gps_expiry_date: formData.gps_expiry_date,
      };

      console.log('Sending update data:', updateData);

      const response = await ApiService.updateEquipment(equipment.id, updateData);
      if (response.success) {
        // Show success message with door number extraction info if applicable
        const resAny = response as { doorNumberExtracted?: boolean; extractedDoorNumber?: string; success: boolean };
        if (resAny.doorNumberExtracted && resAny.extractedDoorNumber) {
          toast.success(t('equipment.messages.updateSuccessWithDoorNumber', { doorNumber: resAny.extractedDoorNumber }));
        } else {
          toast.success(t('equipment.messages.updateSuccess'));
        }
        router.push(`/modules/equipment-management/${equipmentId}`);
      } else {
        toast.error(t('equipment.messages.updateError'));
      }
    } catch {
      toast.error(t('equipment.messages.updateError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">{t('equipment.messages.loading')}</span>
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="w-full p-6">
        <div className="flex items-center justify-center py-8">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <span className="ml-2">{t('equipment.messages.notFound')}</span>
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
              {t('equipment.actions.back')}
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{t('equipment.actions.editEquipment')}</h1>
              <p className="text-muted-foreground">{t('equipment.messages.editDescription')}</p>
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
                  <span>{t('equipment.fields.basicInfo')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('equipment.fields.name')} *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={e => handleInputChange('name', e.target.value)}
                      placeholder={t('equipment.fields.namePlaceholder')}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="door_number">{t('equipment.equipment_management.door_number')}</Label>
                    <Input
                      id="door_number"
                      value={formData.door_number}
                      onChange={e => handleInputChange('door_number', e.target.value)}
                      placeholder={t('equipment.equipment_management.door_number')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">{t('equipment.fields.status')} *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={value => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('equipment.fields.selectStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">{t('equipment.status.available')}</SelectItem>
                      <SelectItem value="rented">{t('equipment.status.rented')}</SelectItem>
                      <SelectItem value="maintenance">{t('equipment.status.maintenance')}</SelectItem>
                      <SelectItem value="out_of_service">{t('equipment.status.out_of_service')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category_id">{t('equipment.fields.categoryId')}</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={value => handleInputChange('category_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('equipment.fields.selectCategory')} />
                    </SelectTrigger>
                                      <SelectContent>
                    <SelectItem value="none">{t('equipment.fields.noCategory')}</SelectItem>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">{t('equipment.fields.manufacturer')}</Label>
                    <Input
                      id="manufacturer"
                      value={formData.manufacturer}
                      onChange={e => handleInputChange('manufacturer', e.target.value)}
                      placeholder={t('equipment.fields.manufacturerPlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model_number">{t('equipment.fields.modelNumber')}</Label>
                    <Input
                      id="model_number"
                      value={formData.model_number}
                      onChange={e => handleInputChange('model_number', e.target.value)}
                      placeholder={t('equipment.fields.modelNumberPlaceholder')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serial_number">{t('equipment.fields.serialNumber')}</Label>
                    <Input
                      id="serial_number"
                      value={formData.serial_number}
                      onChange={e => handleInputChange('serial_number', e.target.value)}
                      placeholder={t('equipment.fields.serialNumberPlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chassis_number">{t('equipment.fields.chassisNumber')}</Label>
                    <Input
                      id="chassis_number"
                      value={formData.chassis_number}
                      onChange={e => handleInputChange('chassis_number', e.target.value)}
                      placeholder={t('equipment.fields.chassisNumberPlaceholder')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('equipment.fields.description')}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e => handleInputChange('description', e.target.value)}
                    placeholder={t('equipment.fields.descriptionPlaceholder')}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('equipment.fields.financialInfo')}</CardTitle>
                <CardDescription>{t('equipment.messages.financialDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="daily_rate">{t('equipment.fields.dailyRate')} (SAR)</Label>
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
                  <Label htmlFor="weekly_rate">{t('equipment.fields.weeklyRate')} (SAR)</Label>
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
                  <Label htmlFor="monthly_rate">{t('equipment.fields.monthlyRate')} (SAR)</Label>
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
                <CardTitle>{t('equipment.fields.istimaraInfo')}</CardTitle>
                <CardDescription>{t('equipment.messages.istimaraDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="istimara">{t('equipment.fields.istimaraNumber')}</Label>
                    <Input
                      id="istimara"
                      value={formData.istimara}
                      onChange={e => handleInputChange('istimara', e.target.value)}
                      placeholder={t('equipment.fields.istimaraNumberPlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="istimara_expiry_date">{t('equipment.fields.istimaraExpiryDate')}</Label>
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

            {/* Insurance Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('equipment.fields.insuranceInfo')}</CardTitle>
                <CardDescription>{t('equipment.messages.insuranceDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="insurance">{t('equipment.fields.insuranceNumber')}</Label>
                    <Input
                      id="insurance"
                      value={formData.insurance}
                      onChange={e => handleInputChange('insurance', e.target.value)}
                      placeholder={t('equipment.fields.insuranceNumberPlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insurance_expiry_date">{t('equipment.fields.insuranceExpiryDate')}</Label>
                    <Input
                      id="insurance_expiry_date"
                      type="date"
                      value={formData.insurance_expiry_date}
                      onChange={e => handleInputChange('insurance_expiry_date', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* TUV Card Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('equipment.fields.tuvCardInfo')}</CardTitle>
                <CardDescription>{t('equipment.messages.tuvCardDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tuv_card">{t('equipment.fields.tuvCardNumber')}</Label>
                    <Input
                      id="tuv_card"
                      value={formData.tuv_card}
                      onChange={e => handleInputChange('tuv_card', e.target.value)}
                      placeholder={t('equipment.fields.tuvCardNumberPlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tuv_card_expiry_date">{t('equipment.fields.tuvCardExpiryDate')}</Label>
                    <Input
                      id="tuv_card_expiry_date"
                      type="date"
                      value={formData.tuv_card_expiry_date}
                      onChange={e => handleInputChange('tuv_card_expiry_date', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* GPS Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('equipment.fields.gpsInfo')}</CardTitle>
                <CardDescription>{t('equipment.messages.gpsDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gps_install_date">{t('equipment.fields.gpsInstallDate')}</Label>
                    <Input
                      id="gps_install_date"
                      type="date"
                      value={formData.gps_install_date}
                      onChange={e => handleInputChange('gps_install_date', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gps_expiry_date">{t('equipment.fields.gpsExpiryDate')}</Label>
                    <Input
                      id="gps_expiry_date"
                      type="date"
                      value={formData.gps_expiry_date}
                      onChange={e => handleInputChange('gps_expiry_date', e.target.value)}
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
              {t('equipment.actions.cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {t('equipment.actions.save')}
            </Button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
