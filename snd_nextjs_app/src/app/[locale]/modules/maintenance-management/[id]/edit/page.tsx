'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EquipmentDropdown } from '@/components/ui/equipment-dropdown';
import { EmployeeDropdown } from '@/components/ui/employee-dropdown';
import { MaintenanceItemsManager, MaintenanceItem } from '@/components/maintenance/MaintenanceItemsManager';
import { MaintenanceWorkflow } from '@/components/maintenance/MaintenanceWorkflow';
import { useI18n } from '@/hooks/use-i18n';
import { useRBAC } from '@/lib/rbac/rbac-context';
import ApiService from '@/lib/api-service';
import { toast } from 'sonner';
import { ArrowLeft, Save, Wrench } from 'lucide-react';

interface MaintenanceRecord {
  id: number;
  equipment_id: number;
  title: string;
  description: string;
  status: string;
  type: string;
  scheduled_date: string;
  due_date?: string;
  cost?: string;
  assigned_to_employee_id?: number;
  equipment: {
    id: number;
    name: string;
    doorNumber?: string;
  };
  mechanic?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  items?: MaintenanceItem[];
}

export default function MaintenanceEditPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const { hasPermission } = useRBAC();
  const [maintenance, setMaintenance] = useState<MaintenanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    equipment_id: '',
    type: 'corrective' as 'scheduled' | 'corrective' | 'emergency' | 'inspection',
    title: '',
    description: '',
    scheduled_date: '',
    due_date: '',
    assigned_to_employee_id: '',
    cost: '',
  });
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>([]);

  const maintenanceId = params.id as string;

  useEffect(() => {
    if (maintenanceId) {
      fetchMaintenanceDetails();
    }
  }, [maintenanceId]);

  const fetchMaintenanceDetails = async () => {
    try {
      setLoading(true);
      const response = await ApiService.get(`/maintenance/${maintenanceId}`);
      
      if (response.success) {
        const data = response.data;
        setMaintenance(data);
        setFormData({
          equipment_id: data.equipment_id.toString(),
          type: data.type,
          title: data.title,
          description: data.description || '',
          scheduled_date: data.scheduled_date,
          due_date: data.due_date || '',
          assigned_to_employee_id: data.assigned_to_employee_id?.toString() || '',
          cost: data.cost || '',
        });
        setMaintenanceItems(data.items || []);
      } else {
        toast.error('Failed to load maintenance details');
        router.push('/modules/maintenance-management');
      }
    } catch (error) {
      console.error('Error fetching maintenance details:', error);
      toast.error('Failed to load maintenance details');
      router.push('/modules/maintenance-management');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.equipment_id || !formData.title || !formData.scheduled_date) {
      toast.error(t('maintenance.validation.validationError'));
      return;
    }

    try {
      setSaving(true);
      const response = await ApiService.put(`/maintenance/${maintenanceId}`, {
        ...formData,
        equipment_id: parseInt(formData.equipment_id),
        assigned_to_employee_id: formData.assigned_to_employee_id ? parseInt(formData.assigned_to_employee_id) : undefined,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        items: maintenanceItems,
      });

      if (response.success) {
        toast.success(t('maintenance.messages.updateSuccess'));
        router.push(`/modules/maintenance-management/${maintenanceId}`);
      } else {
        toast.error(t('maintenance.messages.updateError'));
      }
    } catch (error) {
      console.error('Error updating maintenance:', error);
      toast.error(t('maintenance.messages.updateError'));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!maintenance) return;

    try {
      const response = await ApiService.put(`/maintenance/${maintenanceId}`, {
        ...formData,
        status: newStatus,
        equipment_id: parseInt(formData.equipment_id),
        assigned_to_employee_id: formData.assigned_to_employee_id ? parseInt(formData.assigned_to_employee_id) : undefined,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        items: maintenanceItems,
      });

      if (response.success) {
        setMaintenance({ ...maintenance, status: newStatus });
        toast.success(t('maintenance.messages.updateSuccess'));
      } else {
        toast.error(t('maintenance.messages.updateError'));
      }
    } catch (error) {
      console.error('Error updating maintenance status:', error);
      toast.error(t('maintenance.messages.updateError'));
    }
  };

  const handleComplete = async () => {
    await handleStatusChange('completed');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">{t('maintenance.messages.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!maintenance) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Maintenance Not Found</h1>
          <p className="text-gray-600 mb-4">The requested maintenance record could not be found.</p>
          <Button onClick={() => router.push('/modules/maintenance-management')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Maintenance Management
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/modules/maintenance-management/${maintenanceId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.actions.back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('maintenance.actions.editMaintenance')}</h1>
            <p className="text-gray-600">Maintenance ID: #{maintenance.id}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wrench className="h-5 w-5 mr-2" />
                  {t('maintenance.details.basicInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <EquipmentDropdown
                      key={`edit-equipment-${maintenanceId}`}
                      value={formData.equipment_id}
                      onValueChange={(value: string) => setFormData({ ...formData, equipment_id: value })}
                      label={t('maintenance.fields.equipment')}
                      placeholder={t('maintenance.fields.selectEquipment')}
                      required={true}
                      showSearch={true}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">{t('maintenance.fields.type')} *</Label>
                    <Select value={formData.type} onValueChange={(value: string) => setFormData({ ...formData, type: value as 'scheduled' | 'corrective' | 'emergency' | 'inspection' })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">{t('maintenance.types.scheduled')}</SelectItem>
                        <SelectItem value="corrective">{t('maintenance.types.corrective')}</SelectItem>
                        <SelectItem value="emergency">{t('maintenance.types.emergency')}</SelectItem>
                        <SelectItem value="inspection">{t('maintenance.types.inspection')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="title">{t('maintenance.fields.title')} *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={t('maintenance.fields.titlePlaceholder')}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">{t('maintenance.fields.description')}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('maintenance.fields.descriptionPlaceholder')}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scheduled_date">{t('maintenance.fields.scheduledDate')} *</Label>
                    <Input
                      id="scheduled_date"
                      type="date"
                      value={formData.scheduled_date}
                      onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="due_date">{t('maintenance.fields.dueDate')}</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <EmployeeDropdown
                      key={`edit-employee-${maintenanceId}`}
                      value={formData.assigned_to_employee_id}
                      onValueChange={(value: string) => setFormData({ ...formData, assigned_to_employee_id: value })}
                      label={t('maintenance.fields.assignedTo')}
                      placeholder={t('maintenance.fields.selectEmployee')}
                      required={false}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost">{t('maintenance.fields.estimatedCost')}</Label>
                    <Input
                      id="cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      placeholder={t('maintenance.fields.costPlaceholder')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Maintenance Items */}
            <MaintenanceItemsManager
              items={maintenanceItems}
              onItemsChange={setMaintenanceItems}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Workflow */}
            <MaintenanceWorkflow
              currentStatus={maintenance.status}
              onStatusChange={handleStatusChange}
              onComplete={handleComplete}
              readonly={false}
            />

            {/* Save Button */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? t('maintenance.messages.saving') : t('maintenance.actions.update')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
