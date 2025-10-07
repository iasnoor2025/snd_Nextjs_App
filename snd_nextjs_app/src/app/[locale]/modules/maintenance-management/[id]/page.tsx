'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MaintenanceWorkflow } from '@/components/maintenance/MaintenanceWorkflow';
import { MaintenanceItem } from '@/components/maintenance/MaintenanceItemsManager';
import { useI18n } from '@/hooks/use-i18n';
import { useRBAC } from '@/lib/rbac/rbac-context';
import ApiService from '@/lib/api-service';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Calendar, User, Wrench, DollarSign } from 'lucide-react';

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

export default function MaintenanceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const { hasPermission } = useRBAC();
  const [maintenance, setMaintenance] = useState<MaintenanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [_updating, setUpdating] = useState(false);

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
        setMaintenance(response.data);
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

  const handleStatusChange = async (newStatus: string) => {
    if (!maintenance) return;

    try {
      setUpdating(true);
      const response = await ApiService.put(`/maintenance/${maintenanceId}`, {
        ...maintenance,
        status: newStatus,
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
    } finally {
      setUpdating(false);
    }
  };

  const handleComplete = async () => {
    await handleStatusChange('completed');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'corrective': return 'bg-red-100 text-red-800';
      case 'emergency': return 'bg-orange-100 text-orange-800';
      case 'inspection': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
            onClick={() => router.push('/modules/maintenance-management')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.actions.back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{maintenance.title}</h1>
            <p className="text-gray-600">Maintenance ID: #{maintenance.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(maintenance.status)}>
            {t(`maintenance.status.${maintenance.status}`)}
          </Badge>
          {hasPermission('maintenance', 'update') && (
            <Button
              onClick={() => router.push(`/modules/maintenance-management/${maintenanceId}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              {t('maintenance.actions.editMaintenance')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wrench className="h-5 w-5 mr-2" />
                {t('maintenance.details.basicInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t('maintenance.fields.equipment')}
                  </Label>
                  <p className="text-sm font-medium">
                    {maintenance.equipment.name}
                    {maintenance.equipment.doorNumber && ` (Door: ${maintenance.equipment.doorNumber})`}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t('maintenance.fields.type')}
                  </Label>
                  <Badge className={getTypeColor(maintenance.type)}>
                    {t(`maintenance.types.${maintenance.type}`)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t('maintenance.fields.scheduledDate')}
                  </Label>
                  <p className="text-sm flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(maintenance.scheduled_date).toLocaleDateString()}
                  </p>
                </div>
                {maintenance.due_date && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t('maintenance.fields.dueDate')}
                    </Label>
                    <p className="text-sm flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(maintenance.due_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {maintenance.mechanic && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t('maintenance.fields.assignedTo')}
                    </Label>
                    <p className="text-sm flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {maintenance.mechanic.first_name} {maintenance.mechanic.last_name}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t('maintenance.fields.cost')}
                  </Label>
                  <p className="text-sm flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    {maintenance.cost ? `SAR ${Number(maintenance.cost).toLocaleString()}` : 'Not set'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {maintenance.description && (
            <Card>
              <CardHeader>
                <CardTitle>{t('maintenance.fields.description')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {maintenance.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Maintenance Items */}
          {maintenance.items && maintenance.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('maintenance.items.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('maintenance.items.name')}</TableHead>
                      <TableHead>{t('maintenance.items.quantity')}</TableHead>
                      <TableHead>{t('maintenance.items.unit')}</TableHead>
                      <TableHead>{t('maintenance.items.unitCost')}</TableHead>
                      <TableHead>{t('maintenance.items.totalCost')}</TableHead>
                      <TableHead>{t('maintenance.items.description')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenance.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unit || '-'}</TableCell>
                        <TableCell>SAR {item.unitCost.toFixed(2)}</TableCell>
                        <TableCell className="font-medium">SAR {item.totalCost.toFixed(2)}</TableCell>
                        <TableCell className="max-w-xs truncate">{item.description || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 flex justify-end">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-lg font-semibold">
                      {t('maintenance.items.totalCost')}: SAR {maintenance.items.reduce((sum, item) => sum + item.totalCost, 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Workflow */}
          <MaintenanceWorkflow
            currentStatus={maintenance.status}
            onStatusChange={handleStatusChange}
            onComplete={handleComplete}
            readonly={!hasPermission('maintenance', 'update')}
          />
        </div>
      </div>
    </div>
  );
}
