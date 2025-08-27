'use client';

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
  description?: string;
  door_number?: string;
  created_at?: string;
  updated_at?: string;
}

export default function EquipmentShowPage() {
  const params = useParams();
  const router = useRouter();
  const { confirmDeleteEquipment } = useDeleteConfirmations();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const equipmentId = params.id as string;

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
        toast.error('Failed to load equipment');
        router.push('/modules/equipment-management');
      }
    } catch (error) {
      toast.error('Failed to load equipment');
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
          toast.success('Equipment deleted successfully');
          router.push('/modules/equipment-management');
        } else {
          toast.error('Failed to delete equipment');
        }
      } catch (error) {
        toast.error('Failed to delete equipment');
      } finally {
        setDeleting(false);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: {
        className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
        label: 'Available',
      },
      assigned: {
        className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
        label: 'Assigned',
      },
      rented: {
        className: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
        label: 'Rented',
      },
      maintenance: {
        className: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
        label: 'Maintenance',
      },
      out_of_service: {
        className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
        label: 'Out of Service',
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
          <span className="ml-2">Loading equipment...</span>
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="w-full p-6">
        <div className="flex items-center justify-center py-8">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <span className="ml-2">Equipment not found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push('/modules/equipment-management')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Equipment
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{equipment.name}</h1>
            <p className="text-muted-foreground">Equipment Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Equipment
          </Button>

          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete Equipment
          </Button>
        </div>
      </div>

      {/* Equipment Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Basic Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                <p className="text-lg font-medium">{equipment.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                <div className="mt-1">{getStatusBadge(equipment.status)}</div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Door Number</Label>
                <p className="text-sm">{equipment.door_number || 'Not specified'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Serial Number</Label>
                <p className="text-sm font-mono">{equipment.serial_number || 'Not specified'}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Model Number</Label>
                <p className="text-sm">{equipment.model_number || 'Not specified'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Manufacturer</Label>
                <p className="text-sm">{equipment.manufacturer || 'Not specified'}</p>
              </div>
            </div>



            <Separator />

            <div>
              <Label className="text-sm font-medium text-muted-foreground">Description</Label>
              <p className="text-sm">{equipment.description || 'No description available'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Financial Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Daily Rate</Label>
                <p className="text-lg font-medium">
                  {equipment.daily_rate ? `SAR ${equipment.daily_rate.toFixed(2)}` : 'Not set'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Weekly Rate</Label>
                <p className="text-lg font-medium">
                  {equipment.weekly_rate ? `SAR ${equipment.weekly_rate.toFixed(2)}` : 'Not set'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Monthly Rate</Label>
                <p className="text-lg font-medium">
                  {equipment.monthly_rate ? `SAR ${equipment.monthly_rate.toFixed(2)}` : 'Not set'}
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
              <span>System Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Equipment ID</Label>
                <p className="text-sm font-mono">{equipment.id}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">ERPNext ID</Label>
                <p className="text-sm font-mono">{equipment.erpnext_id || 'Not synced'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Category ID</Label>
                <p className="text-sm">{equipment.category_id || 'Not assigned'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Istimara Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Hash className="h-5 w-5" />
              <span>Istimara Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Istimara Number</Label>
                <p className="text-sm font-mono">{equipment.istimara || 'Not specified'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Expiry Date</Label>
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
              <span>Timestamps</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Created At</Label>
                <p className="text-sm">
                  {equipment.created_at
                    ? new Date(equipment.created_at).toLocaleString()
                    : 'Not available'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                <p className="text-sm">
                  {equipment.updated_at
                    ? new Date(equipment.updated_at).toLocaleString()
                    : 'Not available'}
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
  );
}
