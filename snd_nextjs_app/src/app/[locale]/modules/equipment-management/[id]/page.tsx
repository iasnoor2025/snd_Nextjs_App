
'use client';


// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/protected-route';
import EquipmentDocumentUpload from '@/components/equipment/EquipmentDocumentUpload';
import EquipmentAssignmentHistory from '@/components/equipment/EquipmentRentalHistory';
import ExpiryDateDisplay from '@/components/shared/ExpiryDateDisplay';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import ApiService from '@/lib/api-service';
import { useDeleteConfirmations } from '@/lib/utils/confirmation-utils';
import { useRBAC } from '@/lib/rbac/rbac-context';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Database,
  DollarSign,
  Edit,
  Hash,
  Loader2,
  Package,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
  created_at?: string;
  updated_at?: string;
}

export default function EquipmentShowPage() {
  const { t } = useTranslations();
  const params = useParams();
  const router = useRouter();
  const { confirmDeleteEquipment } = useDeleteConfirmations();
  const { hasPermission } = useRBAC();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const equipmentId = params.id as string;

  // Get allowed actions for equipment management
  // const allowedActions = getAllowedActions('Equipment');

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

  const handleEdit = () => {
    router.push(`/modules/equipment-management/${equipmentId}/edit`);
  };

  const handleDelete = async () => {
    if (!equipment) return;

    const confirmed = await confirmDeleteEquipment(equipment.name);
    if (confirmed) {
      setDeleting(true);
      try {
        const response = await ApiService.deleteEquipment(equipment.id);
        if (response.success) {
          toast.success(t('equipment.messages.deleteSuccess'));
          router.push('/modules/equipment-management');
        } else {
          toast.error(t('equipment.messages.deleteError'));
        }
      } catch {
        toast.error(t('equipment.messages.deleteError'));
      } finally {
        setDeleting(false);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: {
        className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
        label: t('equipment.status.available'),
      },
      assigned: {
        className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
        label: t('equipment.status.assigned'),
      },
      rented: {
        className: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
        label: t('equipment.status.rented'),
      },
      maintenance: {
        className: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
        label: t('equipment.status.maintenance'),
      },
      out_of_service: {
        className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
        label: t('equipment.status.out_of_service'),
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
      label: status,
    };
    return <Badge className={config.className}>{config.label}</Badge>;
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
            <Button variant="ghost" onClick={() => router.push('/modules/equipment-management')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('equipment.actions.back')}
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{equipment.name}</h1>
              <p className="text-muted-foreground">{t('equipment.messages.equipmentDetails')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {hasPermission('update', 'Equipment') && (
              <Button onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                {t('equipment.actions.editEquipment')}
              </Button>
            )}

            {hasPermission('delete', 'Equipment') && (
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {t('equipment.actions.deleteEquipment')}
              </Button>
            )}
          </div>
        </div>

        {/* Equipment Details */}
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
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('equipment.fields.name')}</Label>
                  <p className="text-lg font-medium">{equipment.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('equipment.fields.status')}</Label>
                  <div className="mt-1">{getStatusBadge(equipment.status)}</div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('equipment.equipment_management.door_number')}</Label>
                  <p className="text-sm">{equipment.door_number || t('equipment.messages.notSpecified')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('equipment.fields.serialNumber')}</Label>
                  <p className="text-sm font-mono">{equipment.serial_number || t('equipment.messages.notSpecified')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('equipment.fields.chassisNumber')}</Label>
                  <p className="text-sm font-mono">{equipment.chassis_number || t('equipment.messages.notSpecified')}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('equipment.fields.modelNumber')}</Label>
                  <p className="text-sm">{equipment.model_number || t('equipment.messages.notSpecified')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('equipment.fields.manufacturer')}</Label>
                  <p className="text-sm">{equipment.manufacturer || t('equipment.messages.notSpecified')}</p>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium text-muted-foreground">{t('equipment.fields.description')}</Label>
                <p className="text-sm">{equipment.description || t('equipment.messages.noDescriptionAvailable')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>{t('equipment.fields.financialInfo')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('equipment.fields.dailyRate')}</Label>
                  <p className="text-lg font-medium">
                    {equipment.daily_rate ? `SAR ${Number(equipment.daily_rate).toFixed(2)}` : t('equipment.messages.notSet')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('equipment.fields.weeklyRate')}</Label>
                  <p className="text-lg font-medium">
                    {equipment.weekly_rate ? `SAR ${Number(equipment.weekly_rate).toFixed(2)}` : t('equipment.messages.notSet')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('equipment.fields.monthlyRate')}</Label>
                  <p className="text-lg font-medium">
                    {equipment.monthly_rate ? `SAR ${Number(equipment.monthly_rate).toFixed(2)}` : t('equipment.messages.notSet')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>{t('equipment.messages.systemInfo')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('equipment.messages.equipmentId')}</Label>
                  <p className="text-sm font-mono">{equipment.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('equipment.fields.erpnextId')}</Label>
                  <p className="text-sm font-mono">{equipment.erpnext_id || t('equipment.messages.notSynced')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('equipment.fields.categoryId')}</Label>
                  <p className="text-sm">{equipment.category_id || t('equipment.messages.notAssigned')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Istimara Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Hash className="h-5 w-5" />
                <span>{t('equipment.fields.istimaraInfo')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('equipment.fields.istimaraNumber')}</Label>
                  <p className="text-sm font-mono">{equipment.istimara || t('equipment.messages.notSpecified')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('equipment.fields.istimaraExpiryDate')}</Label>
                  <ExpiryDateDisplay
                    date={equipment.istimara_expiry_date}
                    showIcon={true}
                    showPrefix={true}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>{t('equipment.fields.timestamps')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('equipment.fields.createdAt')}</Label>
                  <p className="text-sm">
                    {equipment.created_at
                      ? new Date(equipment.created_at).toLocaleString()
                      : t('equipment.messages.notAvailable')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('equipment.fields.lastUpdated')}</Label>
                  <p className="text-sm">
                    {equipment.updated_at
                      ? new Date(equipment.updated_at).toLocaleString()
                      : t('equipment.messages.notAvailable')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignment History */}
        <EquipmentAssignmentHistory equipmentId={equipment.id} />

        {/* Documents */}
        <EquipmentDocumentUpload equipmentId={equipment.id} />
      </div>
    </ProtectedRoute>
  );
}
