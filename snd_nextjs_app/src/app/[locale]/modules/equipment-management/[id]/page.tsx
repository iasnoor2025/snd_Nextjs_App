
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ApiService from '@/lib/api-service';
import { useDeleteConfirmations } from '@/lib/utils/confirmation-utils';
import { useRBAC } from '@/lib/rbac/rbac-context';
import {
  AlertCircle,
  ArrowLeft,
  DollarSign,
  Edit,
  FileText,
  Hash,
  History,
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
  insurance?: string;
  insurance_expiry_date?: string;
  tuv_card?: string;
  tuv_card_expiry_date?: string;
  gps_install_date?: string;
  gps_expiry_date?: string;
  serial_number?: string;
  chassis_number?: string;
  description?: string;
  door_number?: string;
  created_at?: string;
  updated_at?: string;
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

export default function EquipmentShowPage() {
  const { t } = useTranslations();
  const params = useParams();
  const router = useRouter();
  const { confirmDeleteEquipment } = useDeleteConfirmations();
  const { hasPermission } = useRBAC();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [category, setCategory] = useState<EquipmentCategory | null>(null);
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
        // Fetch category if equipment has category_id
        if (response.data.category_id) {
          fetchCategory(response.data.category_id);
        }
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

  const fetchCategory = async (categoryId: number) => {
    try {
      const response = await fetch(`/api/equipment/categories/${categoryId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCategory(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch category:', error);
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

        {/* Tabbed Interface */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Equipment Details
            </TabsTrigger>
            <TabsTrigger value="assignment" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Assignment
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
          </TabsList>

          {/* Equipment Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Package className="h-5 w-5" />
                <span>{t('equipment.fields.basicInfo')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Primary Info */}
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground">{equipment.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      {getStatusBadge(equipment.status)}
                      {category && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="text-base">{category.icon}</span>
                          <span>{category.name}</span>
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('equipment.fields.modelNumber')}</Label>
                  <p className="font-medium">{equipment.model_number || t('equipment.messages.notSpecified')}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('equipment.fields.manufacturer')}</Label>
                  <p className="font-medium">{equipment.manufacturer || t('equipment.messages.notSpecified')}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('equipment.equipment_management.door_number')}</Label>
                  <p className="font-mono text-sm">{equipment.door_number || t('equipment.messages.notSpecified')}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('equipment.fields.serialNumber')}</Label>
                  <p className="font-mono text-sm">{equipment.serial_number || t('equipment.messages.notSpecified')}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('equipment.fields.chassisNumber')}</Label>
                  <p className="font-mono text-sm">{equipment.chassis_number || t('equipment.messages.notSpecified')}</p>
                </div>
              </div>

              {/* Description */}
              {equipment.description && (
                <div className="pt-2 border-t">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('equipment.fields.description')}</Label>
                  <p className="text-sm text-muted-foreground mt-1">{equipment.description}</p>
                </div>
              )}
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

          {/* Insurance Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Hash className="h-5 w-5" />
                <span>{t('equipment.fields.insuranceInfo')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('equipment.fields.insuranceNumber')}</Label>
                  <p className="text-sm font-mono">{equipment.insurance || t('equipment.messages.notSpecified')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('equipment.fields.insuranceExpiryDate')}</Label>
                  <ExpiryDateDisplay
                    date={equipment.insurance_expiry_date}
                    showIcon={true}
                    showPrefix={true}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TUV Card Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Hash className="h-5 w-5" />
                <span>{t('equipment.fields.tuvCardInfo')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('equipment.fields.tuvCardNumber')}</Label>
                  <p className="text-sm font-mono">{equipment.tuv_card || t('equipment.messages.notSpecified')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('equipment.fields.tuvCardExpiryDate')}</Label>
                  <ExpiryDateDisplay
                    date={equipment.tuv_card_expiry_date}
                    showIcon={true}
                    showPrefix={true}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GPS Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Hash className="h-5 w-5" />
                <span>{t('equipment.fields.gpsInfo')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('equipment.fields.gpsInstallDate')}</Label>
                  <p className="text-sm font-mono">
                    {equipment.gps_install_date 
                      ? new Date(equipment.gps_install_date).toLocaleDateString() 
                      : t('equipment.messages.notSpecified')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('equipment.fields.gpsExpiryDate')}</Label>
                  <ExpiryDateDisplay
                    date={equipment.gps_expiry_date}
                    showIcon={true}
                    showPrefix={true}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

            </div>
          </TabsContent>

          {/* Assignment Tab */}
          <TabsContent value="assignment">
            <EquipmentAssignmentHistory equipmentId={equipment.id} />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <EquipmentDocumentUpload equipmentId={equipment.id} />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
